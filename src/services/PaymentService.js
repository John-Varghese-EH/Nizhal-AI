import { BrowserWindow } from 'electron';
import Stripe from 'stripe';
import Razorpay from 'razorpay';

export class PaymentService {
    constructor() {
        this.stripeClient = null;
        this.razorpayClient = null;
        this.paymentWindow = null;

        this.products = {
            'bestie_persona': {
                id: 'bestie_persona',
                name: 'Bestie Persona Pack',
                description: 'Your caring female companion with emotional intelligence',
                priceINR: 299,
                priceUSD: 3.99,
                type: 'persona'
            },
            'buddy_persona': {
                id: 'buddy_persona',
                name: 'Buddy Persona Pack',
                description: 'Your supportive male companion with practical advice',
                priceINR: 299,
                priceUSD: 3.99,
                type: 'persona'
            },
            'premium_voice_pack': {
                id: 'premium_voice_pack',
                name: 'Premium Voice Pack',
                description: 'High-quality ElevenLabs voices',
                priceINR: 499,
                priceUSD: 5.99,
                type: 'addon'
            },
            'memory_expansion': {
                id: 'memory_expansion',
                name: 'Memory Expansion',
                description: 'Increase memory slots from 1000 to 10000',
                priceINR: 199,
                priceUSD: 2.99,
                type: 'addon'
            },
            'pro_bundle': {
                id: 'pro_bundle',
                name: 'Elite Tier',
                description: 'All personas + Premium voices + Memory boost',
                priceINR: 799,
                priceUSD: 9.99,
                type: 'bundle'
            },
            'ultimate_tier': {
                id: 'ultimate_tier',
                name: 'Ultimate Access',
                description: 'Elite Tier + Future personas + Priority support',
                priceINR: 1499,
                priceUSD: 19.99,
                type: 'bundle'
            }
        };
    }

    initializeStripe(apiKey) {
        try {
            this.stripeClient = new Stripe(apiKey);
            return true;
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
            return false;
        }
    }

    initializeRazorpay(keyId, keySecret) {
        try {
            this.razorpayClient = new Razorpay({
                key_id: keyId,
                key_secret: keySecret
            });
            return true;
        } catch (error) {
            console.error('Failed to initialize Razorpay:', error);
            return false;
        }
    }

    getProduct(productId) {
        return this.products[productId] || null;
    }

    getAllProducts() {
        return Object.values(this.products);
    }

    async initiateCheckout(productId, gateway, parentWindow) {
        const product = this.products[productId];
        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        try {
            if (gateway === 'stripe') {
                return await this.initiateStripeCheckout(product, parentWindow);
            } else if (gateway === 'razorpay') {
                return await this.initiateRazorpayCheckout(product, parentWindow);
            }
            return { success: false, error: 'Invalid gateway' };
        } catch (error) {
            console.error('Checkout error:', error);
            return { success: false, error: error.message };
        }
    }

    async initiateStripeCheckout(product, parentWindow) {
        if (!this.stripeClient) {
            return { success: false, error: 'Stripe not initialized' };
        }

        const session = await this.stripeClient.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                        description: product.description
                    },
                    unit_amount: Math.round(product.priceUSD * 100)
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: 'nizhal://payment/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'nizhal://payment/cancel'
        });

        return this.openPaymentWindow(session.url, parentWindow);
    }

    async initiateRazorpayCheckout(product, parentWindow) {
        if (!this.razorpayClient) {
            return { success: false, error: 'Razorpay not initialized' };
        }

        const order = await this.razorpayClient.orders.create({
            amount: product.priceINR * 100,
            currency: 'INR',
            receipt: `order_${product.id}_${Date.now()}`,
            notes: {
                productId: product.id,
                productName: product.name
            }
        });

        const razorpayHtml = this.generateRazorpayPage(order, product);
        return this.openPaymentHtmlWindow(razorpayHtml, parentWindow);
    }

    generateRazorpayPage(order, product) {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nizhal AI - Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .loader {
      width: 50px;
      height: 50px;
      border: 3px solid #333;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { margin-top: 20px; }
    p { color: #888; }
  </style>
</head>
<body>
  <div class="loader"></div>
  <h2>Initiating Payment...</h2>
  <p>${product.name} - ₹${product.priceINR}</p>
  <script>
    const options = {
      key: '${process.env.RAZORPAY_KEY_ID || 'rzp_test_key'}',
      amount: ${order.amount},
      currency: 'INR',
      name: 'Nizhal AI',
      description: '${product.description}',
      order_id: '${order.id}',
      handler: function(response) {
        window.location.href = 'nizhal://payment/success?' + 
          'payment_id=' + response.razorpay_payment_id +
          '&order_id=' + response.razorpay_order_id +
          '&signature=' + response.razorpay_signature;
      },
      modal: {
        ondismiss: function() {
          window.location.href = 'nizhal://payment/cancel';
        }
      },
      prefill: {
        name: '',
        email: '',
        contact: ''
      },
      theme: {
        color: '#6366f1'
      }
    };
    
    const rzp = new Razorpay(options);
    rzp.open();
  </script>
</body>
</html>`;
    }

    openPaymentWindow(url, parentWindow) {
        return new Promise((resolve) => {
            this.paymentWindow = new BrowserWindow({
                width: 500,
                height: 700,
                parent: parentWindow,
                modal: true,
                show: true,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            this.paymentWindow.loadURL(url);

            this.paymentWindow.webContents.on('will-navigate', (event, navigationUrl) => {
                if (navigationUrl.startsWith('nizhal://payment/success')) {
                    const urlParams = new URL(navigationUrl);
                    const paymentId = urlParams.searchParams.get('session_id') ||
                        urlParams.searchParams.get('payment_id');
                    this.paymentWindow.close();
                    resolve({ success: true, paymentId, gateway: 'stripe' });
                } else if (navigationUrl.startsWith('nizhal://payment/cancel')) {
                    this.paymentWindow.close();
                    resolve({ success: false, cancelled: true });
                }
            });

            this.paymentWindow.on('closed', () => {
                this.paymentWindow = null;
            });
        });
    }

    openPaymentHtmlWindow(html, parentWindow) {
        return new Promise((resolve) => {
            this.paymentWindow = new BrowserWindow({
                width: 500,
                height: 700,
                parent: parentWindow,
                modal: true,
                show: true,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            this.paymentWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

            this.paymentWindow.webContents.on('will-navigate', (event, navigationUrl) => {
                if (navigationUrl.startsWith('nizhal://payment/success')) {
                    const urlParams = new URL(navigationUrl);
                    const paymentId = urlParams.searchParams.get('payment_id');
                    const orderId = urlParams.searchParams.get('order_id');
                    const signature = urlParams.searchParams.get('signature');
                    this.paymentWindow.close();
                    resolve({ success: true, paymentId, orderId, signature, gateway: 'razorpay' });
                } else if (navigationUrl.startsWith('nizhal://payment/cancel')) {
                    this.paymentWindow.close();
                    resolve({ success: false, cancelled: true });
                }
            });

            this.paymentWindow.on('closed', () => {
                this.paymentWindow = null;
            });
        });
    }

    async verifyPayment(paymentData, gateway) {
        try {
            if (gateway === 'stripe' && this.stripeClient) {
                const session = await this.stripeClient.checkout.sessions.retrieve(paymentData.sessionId);
                return {
                    verified: session.payment_status === 'paid',
                    details: session
                };
            } else if (gateway === 'razorpay' && this.razorpayClient) {
                const crypto = await import('crypto');
                const expectedSignature = crypto.default
                    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
                    .update(`${paymentData.orderId}|${paymentData.paymentId}`)
                    .digest('hex');

                return {
                    verified: expectedSignature === paymentData.signature,
                    details: paymentData
                };
            }
            return { verified: false, error: 'Invalid gateway' };
        } catch (error) {
            console.error('Payment verification error:', error);
            return { verified: false, error: error.message };
        }
    }
}
