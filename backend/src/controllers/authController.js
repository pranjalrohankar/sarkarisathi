const supabase = require('../config/supabase');

exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Sign up user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name }
            }
        });

        if (authError) throw authError;
        if (!authData || !authData.user) throw new Error('Auth signup failed to return user data');

        // 2. Create profile in 'users' table
        const { error: profileError } = await supabase
            .from('users')
            .insert([
                { 
                    id: authData.user.id, 
                    email: email, 
                    name: name,
                    current_plan: 'Basic'
                }
            ]);

        if (profileError) {
            console.error('Profile Creation Error:', profileError);
            // Even if profile fails, user is created in Auth
        }

        res.status(201).json({ success: true, message: 'Account created successfully! Please check your email for verification.' });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        res.json({
            success: true,
            token: data.session.access_token,
            user: {
                id: data.user.id,
                name: profile?.name || data.user.user_metadata.full_name,
                email: data.user.email,
                currentPlan: profile?.current_plan || 'Basic'
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;
        res.json({ success: true, user: profile });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
