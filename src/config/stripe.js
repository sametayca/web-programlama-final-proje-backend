const Stripe = require('stripe');

// Only initialize Stripe if API key is provided
let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });
  console.log('✅ Stripe initialized successfully');
} else {
  console.warn('⚠️  STRIPE: API Key not found. Wallet payment features will be disabled.');
  console.warn('   Please add STRIPE_SECRET_KEY to .env file for payment features.');
}

module.exports = stripe;

