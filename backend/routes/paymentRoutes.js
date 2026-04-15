const express = require('express');
const router = express.Router();
// We use an environment variable for the secret key if it exists, otherwise use a placeholder test key.
// IMPORTANT: Replace this with your actual Stripe Secret key in the .env file.
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_4eC39HqLyjWDarjtT1zdp7dc';
const stripe = require('stripe')(stripeSecretKey);

router.post('/create-payment-intent', async (req, res) => {
  try {
    let { amount } = req.body;
    // Amount should be in cents. Minimum is usually 50 cents (so 50)
    if (!amount || amount < 50) {
      amount = 50; 
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(400).send({ error: error.message });
  }
});

module.exports = router;
