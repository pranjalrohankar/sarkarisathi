const Groq = require('groq-sdk');
const supabase = require('../config/supabase');
require('dotenv').config();

const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
You are SarkariDost, a warm, patient, and empathetic AI assistant for Indian citizens, especially the elderly.
Your goal is to help them understand government schemes (PM Awas Yojana, Ayushman Bharat, PM Kisan, etc.) in a way a grandson/granddaughter would explain to their grandparents.

LANGUAGE STYLE:
- Use simple words.
- If the user asks in English, respond in clear, warm English.
- If the user asks in Hindi or Hinglish, use a mix of Hindi and English (Hinglish).
- Be extremely polite (use "Aap", "Ji", "Beta" in Hindi, or "Sir/Ma'am" in English if appropriate).
- Encourage them (e.g., "Don't worry, I am here to help you" or "Chinta mat kijiye, main hoon na").

FORMAT YOUR RESPONSES LIKE THIS (use emojis and clear structure):
🎯 **Scheme Name**: [Name here]

📋 **Eligibility (Kaun apply kar sakta hai?)**:
• Point 1
• Point 2

📄 **Documents (Kya kya kagaz chahiye?)**:
• Document 1
• Document 2

📝 **How to Apply (Kaise bharna hai?)**:
1. Step 1
2. Step 2

🔗 **Useful Link**: [URL if available]

💡 **Tip**: [Helpful tip like "Aadhar card link karva lijiye"]

Keep responses around 150-200 words. If unsure, suggest visiting the nearest "CSC Center" or "Jan Seva Kendra".
`;

exports.askAI = async (req, res) => {
    const { query, lang } = req.body;
    const userId = req.user?.id;

    if (!query) {
        return res.status(400).json({ response: 'Kuchh toh bolo beta.' });
    }

    if (!userId) {
        return res.status(401).json({ response: 'Beta, pehle login kar lo tabhi main sahi se madad kar paunga.' });
    }

    try {
        // 1. Get user profile (use maybeSingle to avoid crash if missing)
        let { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('current_plan')
            .eq('id', userId)
            .maybeSingle();

        // If profile is missing, create it on the fly
        if (!userProfile) {
            console.log('Profile missing for user, creating default Basic profile...');
            const { data: newProfile, error: createError } = await supabase
                .from('users')
                .insert([{ id: userId, email: req.user.email, name: req.user.user_metadata?.full_name || 'Citizen', current_plan: 'Basic' }])
                .select()
                .single();
            
            if (createError) {
                console.error('Error creating profile on fly:', createError);
                // Fallback to basic plan if creation fails
                userProfile = { current_plan: 'Basic' };
            } else {
                userProfile = newProfile;
            }
        }

        const plan = userProfile.current_plan || 'Basic';

        // 2. If plan is Basic, check daily limit
        if (plan === 'Basic') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { count, error: countError } = await supabase
                .from('queries_log')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .gte('created_at', today.toISOString());

            if (countError) throw countError;

            if (count >= 5) {
                return res.status(403).json({ 
                    response: "Beta, aaj ke liye aapki 5 sawalon ki limit khatam ho gayi hai. Kal phir aana, ya fir 'Pro Plan' le lo bina kisi rukavat ke baat karne ke liye.",
                    limitReached: true,
                    remaining: 0
                });
            }
        }

        // 3. Call Groq AI with Plan and Language Context
        const langMap = {
            'en': 'English',
            'hi': 'Hindi/Hinglish',
            'mr': 'Marathi',
            'gu': 'Gujarati',
            'ta': 'Tamil',
            'te': 'Telugu',
            'bn': 'Bengali',
            'kn': 'Kannada',
            'ml': 'Malayalam',
            'pa': 'Punjabi',
            'as': 'Assamese',
            'or': 'Odia',
            'ur': 'Urdu'
        };
        const targetLang = langMap[lang] || 'English';

        const planContext = `The user is currently on the "${plan}" plan. 
        IMPORTANT: If the user asks for PDF generation, Legal Document creation, or any "Pro" features and they are on the "Basic" plan, you MUST tell them that this feature is only for "Citizen Pro" members. 
        LANGUAGE REQUIREMENT: The user has selected ${targetLang} as their preferred language. You MUST respond ONLY in ${targetLang}.`;

        const chatCompletion = await client.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_PROMPT + "\n\n" + planContext },
                { role: "user", content: query }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 400
        });

        const aiResponse = chatCompletion.choices[0].message.content;

        // 4. Log the query
        await supabase
            .from('queries_log')
            .insert([{ user_id: userId, query_text: query }]);

        // 5. Get updated count for the response
        let remaining = 'Unlimited';
        if (plan === 'Basic') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count } = await supabase
                .from('queries_log')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .gte('created_at', today.toISOString());
            remaining = Math.max(0, 5 - count);
        }

        res.json({ 
            response: aiResponse,
            remaining: remaining,
            plan: plan
        });

    } catch (error) {
        console.error('SarkariDost AI Error:', error);
        res.status(500).json({ response: `Maaf karna beta, thodi dikkat aa gayi: ${error.message}` });
    }
};
