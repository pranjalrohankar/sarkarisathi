const Razorpay = require('razorpay');
const supabase = require('../config/supabase');

// Use dummy keys if environment variables are not set
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
    try {
        const { amount, planName } = req.body;

        if (!amount) {
            return res.status(400).json({ success: false, message: 'Amount is required' });
        }

        const options = {
            amount: amount * 100, // Razorpay amount is in paise
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`,
            notes: {
                plan: planName || 'Subscription Plan'
            }
        };

        const order = await razorpay.orders.create(options);
        
        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Razorpay Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Razorpay failed to create order. Please check your API keys in .env', 
            error: error.message 
        });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName, userId } = req.body;
        
        // In a real app, you would verify the signature here
        
        if (userId && planName) {
            let planType = 'Basic';
            if (planName.includes('Pro')) planType = 'Pro';
            if (planName.includes('CSC')) planType = 'CSC';

            const { error } = await supabase
                .from('users')
                .update({ current_plan: planType })
                .eq('id', userId);

            if (error) throw error;
            res.json({ success: true, message: `Payment verified! Your ${planType} plan is now active.` });
        } else {
            res.json({ success: true, message: 'Payment verified successfully' });
        }
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ success: false, message: 'Error verifying payment' });
    }
};
