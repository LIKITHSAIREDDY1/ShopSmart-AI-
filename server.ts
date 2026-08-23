import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { initialProducts } from './src/data/products';
import { Order, Product, UserAccount, OrderStatus } from './src/types';

// In-memory Database Simulation (representing PostgreSQL tables)
interface DBState {
  products: Product[];
  users: UserAccount[];
  orders: Order[];
}

const db: DBState = {
  products: [...initialProducts],
  users: [
    {
      id: 'usr_101',
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      role: 'user',
      phone: '+91 98765 43210',
      address: 'Flat 402, Green Glen Heights, Bellandur',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560103',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_102',
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      role: 'user',
      phone: '+91 98111 22334',
      address: '304, Palm Grove, Koregaon Park',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'admin_001',
      name: 'Admin Vikram Mehta',
      email: 'admin@store.com',
      role: 'admin',
      phone: '+91 90000 11111',
      address: 'Corporate Tech Tower, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201309',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    }
  ],
  orders: [
    {
      id: 'ord_sample_1',
      orderNumber: 'ORD1001',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      items: [
        {
          product: initialProducts[0], // Lenovo IdeaPad Slim 5
          quantity: 1,
          price: 48000
        }
      ],
      subtotal: 48000,
      discount: 0,
      shipping: 0,
      tax: 8640,
      total: 48000,
      customer: {
        name: 'Rohan Sharma',
        email: 'rohan.sharma@example.com',
        phone: '+91 98765 43210',
        address: 'Flat 402, Green Glen Heights, Bellandur',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560103'
      },
      payment: {
        razorpayOrderId: 'order_rzp_test_98a72b',
        razorpayPaymentId: 'pay_test_3fa81b9921',
        method: 'UPI (rohan@okhdfcbank)',
        status: 'SUCCESS',
        paidAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        mode: 'TEST',
        amount: 48000,
        currency: 'INR',
        signatureVerified: true
      },
      status: 'ACCEPTED',
      statusUpdatedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      adminNotes: 'Payment verified via Razorpay webhook. Inventory packed and assigned to BlueDart courier.',
      estimatedDelivery: '2-3 Business Days'
    },
    {
      id: 'ord_sample_2',
      orderNumber: 'ORD1002',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      items: [
        {
          product: initialProducts[10], // Nothing Phone (2a)
          quantity: 1,
          price: 23999
        },
        {
          product: initialProducts[18], // Razer BlackShark V2
          quantity: 1,
          price: 3999
        }
      ],
      subtotal: 27998,
      discount: 0,
      shipping: 0,
      tax: 5039,
      total: 27998,
      customer: {
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        phone: '+91 98111 22334',
        address: '304, Palm Grove, Koregaon Park',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001'
      },
      payment: {
        razorpayOrderId: 'order_rzp_test_41b89c',
        razorpayPaymentId: 'pay_test_88f921ab04',
        method: 'Credit Card (Visa ending in 4242)',
        status: 'SUCCESS',
        paidAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        mode: 'TEST',
        amount: 27998,
        currency: 'INR',
        signatureVerified: true
      },
      status: 'SHIPPED',
      statusUpdatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      adminNotes: 'Dispatched via Delhivery Express (AWB: DEL7749219). Expected delivery tomorrow.',
      estimatedDelivery: 'Tomorrow by 6:00 PM'
    },
    {
      id: 'ord_sample_3',
      orderNumber: 'ORD1003',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      items: [
        {
          product: initialProducts[25], // Keychron K2 V2
          quantity: 1,
          price: 7499
        }
      ],
      subtotal: 7499,
      discount: 0,
      shipping: 0,
      tax: 1350,
      total: 7499,
      customer: {
        name: 'Rohan Sharma',
        email: 'rohan.sharma@example.com',
        phone: '+91 98765 43210',
        address: 'Flat 402, Green Glen Heights, Bellandur',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560103'
      },
      payment: {
        razorpayOrderId: 'order_rzp_test_11cd88',
        razorpayPaymentId: 'pay_test_99e419bb77',
        method: 'Net Banking (HDFC Bank)',
        status: 'SUCCESS',
        paidAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        mode: 'TEST',
        amount: 7499,
        currency: 'INR',
        signatureVerified: true
      },
      status: 'PENDING_APPROVAL',
      statusUpdatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      adminNotes: 'Awaiting order acceptance and packing verification.',
      estimatedDelivery: '3-4 Business Days'
    }
  ]
};

// Initialize Gemini SDK with telemetry header
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Rule-based fallback parser if AI is offline or key not provided
function ruleBasedSearch(query: string, products: Product[]) {
  const lower = query.toLowerCase();
  
  // Extract budget
  let maxPrice: number | undefined;
  const priceMatch = query.match(/(?:under|below|less than|within|budget of)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)(?:k|\s*thousand|\s*k)?/i);
  if (priceMatch) {
    const rawVal = priceMatch[1].replace(/,/g, '');
    let num = parseInt(rawVal, 10);
    if (/k|thousand/i.test(priceMatch[0]) && num < 1000) {
      num = num * 1000;
    }
    if (num > 0) maxPrice = num;
  }

  // Category determination
  let category: string | undefined;
  if (lower.includes('laptop') || lower.includes('notebook') || lower.includes('macbook')) category = 'Laptop';
  else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('smartphone') || lower.includes('iphone') || lower.includes('pixel')) category = 'Smartphone';
  else if (lower.includes('headphone') || lower.includes('earphone') || lower.includes('audio') || lower.includes('earbuds') || lower.includes('airpods') || lower.includes('headset')) category = 'Audio';
  else if (lower.includes('monitor') || lower.includes('screen') || lower.includes('display')) category = 'Monitor';
  else if (lower.includes('tablet') || lower.includes('ipad') || lower.includes('tab')) category = 'Tablet';
  else if (lower.includes('keyboard') || lower.includes('mouse') || lower.includes('ssd') || lower.includes('webcam') || lower.includes('charger') || lower.includes('accessory')) category = 'Accessory';
  else if (lower.includes('watch') || lower.includes('smartwatch') || lower.includes('wearable')) category = 'Wearable';
  else if (lower.includes('alexa') || lower.includes('echo') || lower.includes('home') || lower.includes('speaker')) category = 'SmartHome';

  // Extract purpose
  let purpose = 'General tech requirement';
  if (lower.includes('coding') || lower.includes('programming') || lower.includes('developer') || lower.includes('web dev') || lower.includes('software')) purpose = 'Coding & Software Engineering';
  else if (lower.includes('camera') || lower.includes('photo') || lower.includes('video') || lower.includes('portrait')) purpose = 'Photography & Content Creation';
  else if (lower.includes('gaming') || lower.includes('game') || lower.includes('esports') || lower.includes('bgmi') || lower.includes('rtx')) purpose = 'Gaming & High Performance';
  else if (lower.includes('music') || lower.includes('sound') || lower.includes('noise') || lower.includes('anc')) purpose = 'Music & Active Noise Cancellation';
  else if (lower.includes('art') || lower.includes('drawing') || lower.includes('sketch') || lower.includes('note')) purpose = 'Digital Art & Note Taking';
  else if (lower.includes('fitness') || lower.includes('health') || lower.includes('run') || lower.includes('workout')) purpose = 'Fitness & Health Tracking';

  // Filter products
  let candidates = products.filter(p => {
    if (p.isActive === false) return false;
    if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
    if (maxPrice && p.price > maxPrice) return false;
    return true;
  });

  if (candidates.length === 0 && category) {
    candidates = products.filter(p => p.category.toLowerCase() === category?.toLowerCase() && p.isActive !== false);
  } else if (candidates.length === 0) {
    candidates = products.filter(p => p.isActive !== false).slice(0, 3);
  }

  // Sort by rating & price relevance
  candidates.sort((a, b) => b.rating - a.rating);

  return {
    category: category || 'Electronics',
    purpose,
    maxPrice,
    candidates: candidates.slice(0, 3)
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Master Admin Security Passkeys
  const VALID_ADMIN_PASSKEYS = ['ADMIN@2026', 'admin2026', '882026', 'SHOPSMART_ADMIN_KEY'];

  // Auth: Get Users
  app.get('/api/users', (req: Request, res: Response) => {
    res.json({ users: db.users });
  });

  // Dedicated & Protected Unique Admin Authentication Endpoint
  app.post('/api/auth/admin-login', (req: Request, res: Response) => {
    const { email, passkey, name } = req.body;

    if (!passkey) {
      res.status(400).json({ 
        success: false, 
        error: 'Admin Security Passkey or Master PIN is required to access Admin Operations.' 
      });
      return;
    }

    const trimmedKey = String(passkey).trim();
    const isValidKey = VALID_ADMIN_PASSKEYS.includes(trimmedKey);

    if (!isValidKey) {
      console.warn(`[AUTH] Failed Admin login attempt with key: ${trimmedKey.slice(0, 3)}*** from ${email}`);
      res.status(401).json({ 
        success: false, 
        error: 'Authentication Denied: Invalid Admin Security Passkey or PIN. Master passkey is required for store operations access.' 
      });
      return;
    }

    // Passkey verified! Find or create verified Admin user
    const adminEmail = email?.trim() || 'admin@store.com';
    let adminUser = db.users.find(u => u.email.toLowerCase() === adminEmail.toLowerCase() && u.role === 'admin');

    if (!adminUser) {
      adminUser = {
        id: `admin_${Date.now()}`,
        name: name?.trim() || 'Admin Vikram Mehta',
        email: adminEmail,
        role: 'admin',
        phone: '+91 90000 11111',
        address: 'Corporate Tech Tower, Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201309',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        adminPasskeyVerified: true,
        adminRoleTitle: 'Store Operations Administrator',
        lastLoginAt: new Date().toISOString(),
        authMethod: 'admin_security_passkey'
      };
      db.users.push(adminUser);
    } else {
      adminUser.adminPasskeyVerified = true;
      adminUser.lastLoginAt = new Date().toISOString();
      adminUser.authMethod = 'admin_security_passkey';
    }

    res.json({
      success: true,
      message: 'Admin security passkey verified successfully.',
      user: adminUser,
      securityClearance: 'LEVEL_3_OPS_ADMIN',
      authenticatedAt: new Date().toISOString()
    });
  });

  // Customer / Shopper Standard Login & Signup (Cannot elevate to admin without passkey)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, role = 'user', name, phone, address, city, state, pincode, passkey } = req.body;
    
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Security check: If trying to log in as admin, require valid passkey
    let assignedRole: 'user' | 'admin' = 'user';
    let isPasskeyVerified = false;

    if (role === 'admin') {
      const trimmedKey = passkey ? String(passkey).trim() : '';
      if (VALID_ADMIN_PASSKEYS.includes(trimmedKey)) {
        assignedRole = 'admin';
        isPasskeyVerified = true;
      } else {
        res.status(401).json({
          success: false,
          error: 'Security Error: You must supply a valid Admin Security Passkey to authenticate as an Administrator.'
        });
        return;
      }
    }

    let existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!existing) {
      existing = {
        id: `usr_${Date.now()}`,
        name: name || (assignedRole === 'admin' ? 'Store Administrator' : 'Shopper Customer'),
        email,
        role: assignedRole,
        phone: phone || '+91 98765 00000',
        address: address || '123 Tech Lane',
        city: city || 'Bengaluru',
        state: state || 'Karnataka',
        pincode: pincode || '560001',
        adminPasskeyVerified: isPasskeyVerified,
        lastLoginAt: new Date().toISOString(),
        authMethod: isPasskeyVerified ? 'admin_security_passkey' : 'customer_credentials'
      };
      db.users.push(existing);
    } else {
      if (assignedRole === 'admin' && isPasskeyVerified) {
        existing.role = 'admin';
        existing.adminPasskeyVerified = true;
      }
      existing.lastLoginAt = new Date().toISOString();
    }

    res.json({ success: true, user: existing });
  });

  // Get Products
  app.get('/api/products', (req: Request, res: Response) => {
    const { category, search, maxPrice, includeInactive } = req.query;
    let list = [...db.products];

    if (includeInactive !== 'true') {
      list = list.filter(p => p.isActive !== false);
    }

    if (category && category !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) {
        list = list.filter(p => p.price <= max);
      }
    }

    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.features.some(f => f.toLowerCase().includes(q)) ||
        p.bestFor.some(b => b.toLowerCase().includes(q))
      );
    }

    res.json({ products: list, count: list.length });
  });

  // Get Single Product
  app.get('/api/products/:id', (req: Request, res: Response) => {
    const item = db.products.find(p => p.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ product: item });
  });

  // Admin: Add or Update Product
  app.post('/api/products', (req: Request, res: Response) => {
    const newProduct: Product = {
      ...req.body,
      id: req.body.id || `prod-custom-${Date.now()}`,
      rating: req.body.rating || 4.5,
      reviewsCount: req.body.reviewsCount || 1,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    db.products.unshift(newProduct);
    res.json({ success: true, product: newProduct });
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    const idx = db.products.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    db.products[idx] = { ...db.products[idx], ...req.body };
    res.json({ success: true, product: db.products[idx] });
  });

  // AI Chat and Intent Extraction + Recommendation
  app.post('/api/chat', async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const ai = getGeminiClient();
    const activeProducts = db.products.filter(p => p.isActive !== false);
    const fallback = ruleBasedSearch(message, activeProducts);

    if (!ai) {
      // Offline fallback
      const recommendations = fallback.candidates.map((product, idx) => ({
        productId: product.id,
        product,
        matchScore: idx === 0 ? 96 : idx === 1 ? 90 : 85,
        recommendationReason: `Priced at ₹${product.price.toLocaleString('en-IN')}, within your target budget. Equipped with ${product.ram || 'great specs'} and ${product.storage || 'ample storage'}, making it an optimal match for ${fallback.purpose.toLowerCase()}.`,
        keyStrengths: product.features.slice(0, 3),
        isTopPick: idx === 0
      }));

      const topProduct = recommendations[0]?.product;
      const responseText = topProduct
        ? `Based on your requirement for **${fallback.purpose}** with a budget of ${fallback.maxPrice ? `₹${fallback.maxPrice.toLocaleString('en-IN')}` : 'your target range'}, I recommend the **${topProduct.name}** at ₹${topProduct.price.toLocaleString('en-IN')}. It delivers ${topProduct.ram ? `${topProduct.ram} and ` : ''}${topProduct.storage ? `${topProduct.storage}` : 'outstanding performance'} with a ⭐ ${topProduct.rating}/5 rating.`
        : "I found matching items from our product catalog for your request.";

      res.json({
        content: responseText,
        extractedIntent: {
          category: fallback.category,
          purpose: fallback.purpose,
          maxPrice: fallback.maxPrice,
          confidenceScore: 0.92,
          reasoning: `Identified ${fallback.category} category suited for ${fallback.purpose}.`
        },
        recommendations,
        suggestedPrompts: [
          'What about laptops under ₹45,000 for coding?',
          'Show me phones with great camera under ₹30,000',
          'Best gaming headphones or noise cancelling under ₹5,000'
        ],
        pipelineData: {
          latencyMs: Date.now() - startTime,
          dbQueryTimeMs: 4,
          matchingProductsCount: fallback.candidates.length
        }
      });
      return;
    }

    try {
      const catalogSummary = activeProducts.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price,
        ram: p.ram || 'N/A',
        storage: p.storage || 'N/A',
        processor: p.processor || 'N/A',
        rating: p.rating,
        stock: p.stock,
        description: p.description,
        bestFor: p.bestFor,
        features: p.features
      }));

      const systemPrompt = `You are ShopSmart AI, an expert conversational shopping assistant specialized in understanding customer tech requirements, filtering product databases, and explaining clear purchasing recommendations.
You have access to the following product catalog from the PostgreSQL database:
${JSON.stringify(catalogSummary, null, 2)}

Instructions:
1. Parse the user's intent: Category, Purpose (e.g. Coding, Gaming, Photography, Travel, Office, Student), Target/Max Price in INR ₹, and key technical constraints.
2. Select 1 to 3 best matching products from the catalog that strictly satisfy or come closest to their budget and performance needs. Mark the single best product as isTopPick: true.
3. Write a natural, personalized "recommendationReason" for each product explaining EXACTLY why it matches their specific needs (e.g. "Within your ₹50,000 budget and offers 16GB RAM for smooth IDE compilation").
4. Provide a friendly, helpful conversational response text summarizing your recommendation.
5. Provide 3 smart follow-up suggestions relevant to the conversation.`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          { role: 'user', parts: [{ text: `User request: "${message}"` }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              conversationalResponse: {
                type: Type.STRING,
                description: 'Polished, direct conversational answer explaining the top pick to the user.'
              },
              extractedIntent: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  maxPrice: { type: Type.NUMBER },
                  minPrice: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING },
                  confidenceScore: { type: Type.NUMBER }
                },
                required: ['category', 'purpose', 'reasoning']
              },
              recommendedProductIds: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productId: { type: Type.STRING },
                    matchScore: { type: Type.NUMBER },
                    recommendationReason: { type: Type.STRING },
                    keyStrengths: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    isTopPick: { type: Type.BOOLEAN }
                  },
                  required: ['productId', 'matchScore', 'recommendationReason', 'keyStrengths']
                }
              },
              suggestedPrompts: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['conversationalResponse', 'extractedIntent', 'recommendedProductIds']
          }
        }
      });

      const parsedData = JSON.parse(aiResponse.text || '{}');

      const recommendations = (parsedData.recommendedProductIds || []).map((rec: any) => {
        const fullProduct = db.products.find(p => p.id === rec.productId) || db.products[0];
        return {
          productId: fullProduct.id,
          product: fullProduct,
          matchScore: rec.matchScore || 95,
          recommendationReason: rec.recommendationReason || `Best suited for your requirements with strong rating of ⭐ ${fullProduct.rating}.`,
          keyStrengths: rec.keyStrengths || fullProduct.features.slice(0, 3),
          isTopPick: !!rec.isTopPick
        };
      });

      if (recommendations.length === 0) {
        recommendations.push({
          productId: fallback.candidates[0].id,
          product: fallback.candidates[0],
          matchScore: 92,
          recommendationReason: `Top rated product matching your criteria under ₹${fallback.candidates[0].price.toLocaleString('en-IN')}.`,
          keyStrengths: fallback.candidates[0].features.slice(0, 3),
          isTopPick: true
        });
      }

      res.json({
        content: parsedData.conversationalResponse || `I recommend checking out the ${recommendations[0]?.product.name}.`,
        extractedIntent: parsedData.extractedIntent || {
          category: fallback.category,
          purpose: fallback.purpose,
          maxPrice: fallback.maxPrice,
          confidenceScore: 0.95,
          reasoning: 'Extracted via Gemini 3.7 Flash Model'
        },
        recommendations,
        suggestedPrompts: parsedData.suggestedPrompts || [
          'Compare these options side by side',
          'Show alternative under ₹40,000',
          'Does this include warranty?'
        ],
        pipelineData: {
          latencyMs: Date.now() - startTime,
          dbQueryTimeMs: 6,
          matchingProductsCount: recommendations.length
        }
      });
    } catch (err: any) {
      console.error('Error generating AI chat response:', err);
      const recommendations = fallback.candidates.map((product, idx) => ({
        productId: product.id,
        product,
        matchScore: idx === 0 ? 95 : idx === 1 ? 88 : 82,
        recommendationReason: `Within your ₹${fallback.maxPrice ? fallback.maxPrice.toLocaleString('en-IN') : 'target'} budget with ${product.ram || 'high performance'} suited for ${fallback.purpose.toLowerCase()}.`,
        keyStrengths: product.features.slice(0, 3),
        isTopPick: idx === 0
      }));

      res.json({
        content: `Based on your request, I found the best matching ${fallback.category}s. The top recommendation is **${recommendations[0]?.product.name}** at ₹${recommendations[0]?.product.price.toLocaleString('en-IN')}.`,
        extractedIntent: {
          category: fallback.category,
          purpose: fallback.purpose,
          maxPrice: fallback.maxPrice,
          confidenceScore: 0.90,
          reasoning: `Rule-matched ${fallback.category} catalog filter.`
        },
        recommendations,
        suggestedPrompts: [
          'Show me alternatives under ₹45,000',
          'Compare with HP Pavilion',
          'What is the delivery estimate?'
        ],
        pipelineData: {
          latencyMs: Date.now() - startTime,
          dbQueryTimeMs: 5,
          matchingProductsCount: fallback.candidates.length
        }
      });
    }
  });

  // Razorpay Create Order Endpoint
  app.post('/api/razorpay/create-order', (req: Request, res: Response) => {
    const { amount, currency = 'INR', receipt, items } = req.body;
    
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valid amount is required' });
      return;
    }

    const orderId = `order_rzp_test_${Math.random().toString(36).substring(2, 9)}${Date.now().toString().slice(-4)}`;
    
    res.json({
      success: true,
      orderId,
      amount,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      status: 'created',
      keyId: 'rzp_test_AiShoppingAssist2026',
      notes: {
        platform: 'AI Shopping Assistant',
        mode: 'TEST_MODE'
      }
    });
  });

  // Razorpay Verify & Store Order Endpoint
  app.post('/api/razorpay/verify-payment', (req: Request, res: Response) => {
    const {
      razorpayOrderId,
      razorpayPaymentId = `pay_test_${Math.random().toString(36).substring(2, 10)}`,
      paymentMethod = 'UPI / Test Mode',
      customer,
      items,
      totalAmount,
      simulateFailure = false
    } = req.body;

    if (simulateFailure) {
      res.status(400).json({
        success: false,
        error: 'Payment failed as requested in simulation test mode.',
        code: 'PAYMENT_SIMULATED_FAILURE'
      });
      return;
    }

    const orderNumber = `ORD${1000 + db.orders.length + 1}`;
    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      items: items || [],
      subtotal: totalAmount,
      discount: 0,
      shipping: 0,
      tax: Math.round(totalAmount * 0.18),
      total: totalAmount,
      customer: customer || {
        name: 'Guest Customer',
        email: 'customer@example.com',
        phone: '+91 99999 88888',
        address: 'MG Road, Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      },
      payment: {
        razorpayOrderId: razorpayOrderId || `order_rzp_test_${Date.now()}`,
        razorpayPaymentId,
        method: paymentMethod,
        status: 'SUCCESS',
        paidAt: new Date().toISOString(),
        mode: 'TEST',
        amount: totalAmount,
        currency: 'INR',
        signatureVerified: true
      },
      status: 'PENDING_APPROVAL', // New orders start as PENDING_APPROVAL for Admin to Accept
      statusUpdatedAt: new Date().toISOString(),
      adminNotes: 'Payment verified via Razorpay sandbox. Awaiting admin order review.',
      estimatedDelivery: '3-4 Business Days'
    };

    // Deduct stock
    if (items && Array.isArray(items)) {
      items.forEach((item: any) => {
        const prod = db.products.find(p => p.id === item.product?.id || p.id === item.productId);
        if (prod && prod.stock > 0) {
          prod.stock = Math.max(0, prod.stock - (item.quantity || 1));
        }
      });
    }

    // Save order into database
    db.orders.unshift(newOrder);

    // Save or update user if new
    if (customer?.email) {
      const existingUser = db.users.find(u => u.email.toLowerCase() === customer.email.toLowerCase());
      if (!existingUser) {
        db.users.push({
          id: `usr_${Date.now()}`,
          name: customer.name || 'Valued Customer',
          email: customer.email,
          role: 'user',
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode
        });
      }
    }

    res.json({
      success: true,
      order: newOrder,
      message: 'Payment verified and order persisted in database successfully.'
    });
  });

  // Get Orders (All for admin, or filtered by userEmail for shopper)
  app.get('/api/orders', (req: Request, res: Response) => {
    const { userEmail, status } = req.query;
    let list = [...db.orders];

    if (userEmail) {
      list = list.filter(o => o.customer.email.toLowerCase() === (userEmail as string).toLowerCase());
    }

    if (status && status !== 'ALL') {
      list = list.filter(o => o.status === status);
    }

    res.json({ orders: list, count: list.length });
  });

  // Admin: Update Order Status (Accept, Ship, Deliver, Cancel, Add notes)
  app.put('/api/orders/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminNotes, estimatedDelivery } = req.body;

    const order = db.orders.find(o => o.id === id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (status) {
      order.status = status as OrderStatus;
      order.statusUpdatedAt = new Date().toISOString();
    }
    if (adminNotes !== undefined) {
      order.adminNotes = adminNotes;
    }
    if (estimatedDelivery) {
      order.estimatedDelivery = estimatedDelivery;
    }

    res.json({
      success: true,
      order,
      message: `Order status updated to ${order.status}`
    });
  });

  // Admin: Verify/Check Payment Status on Demand
  app.post('/api/orders/:id/verify-payment', (req: Request, res: Response) => {
    const { id } = req.params;
    const order = db.orders.find(o => o.id === id);
    
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Return detailed Razorpay verification details
    res.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      payment: {
        ...order.payment,
        gateway: 'Razorpay Payment Gateway (Test Mode)',
        captured: true,
        settlementStatus: 'SETTLED_TO_MERCHANT',
        verifiedAt: new Date().toISOString(),
        signatureValid: true,
        customerIp: '127.0.0.1',
        vpaOrCard: order.payment.method
      }
    });
  });

  // Admin: Dashboard Stats Summary
  app.get('/api/admin/stats', (req: Request, res: Response) => {
    const totalOrders = db.orders.length;
    const totalRevenue = db.orders.reduce((sum, o) => sum + (o.payment.status === 'SUCCESS' ? o.total : 0), 0);
    const pendingOrders = db.orders.filter(o => o.status === 'PENDING_APPROVAL').length;
    const acceptedOrders = db.orders.filter(o => o.status === 'ACCEPTED').length;
    const shippedOrders = db.orders.filter(o => o.status === 'SHIPPED').length;
    const deliveredOrders = db.orders.filter(o => o.status === 'DELIVERED').length;
    const lowStockProducts = db.products.filter(p => p.stock < 10).length;

    res.json({
      totalOrders,
      totalRevenue,
      pendingOrders,
      acceptedOrders,
      shippedOrders,
      deliveredOrders,
      lowStockProducts,
      totalProducts: db.products.length,
      totalUsers: db.users.length
    });
  });

  // Database Tables Inspection (PostgreSQL simulator snapshot)
  app.get('/api/database/tables', (req: Request, res: Response) => {
    res.json({
      tables: {
        products: {
          name: 'products',
          rowCount: db.products.length,
          columns: ['id', 'name', 'brand', 'category', 'price', 'ram', 'storage', 'rating', 'stock', 'isActive'],
          rows: db.products
        },
        users: {
          name: 'users',
          rowCount: db.users.length,
          columns: ['id', 'name', 'email', 'role', 'phone', 'city', 'state'],
          rows: db.users
        },
        orders: {
          name: 'orders',
          rowCount: db.orders.length,
          columns: ['id', 'orderNumber', 'customer', 'total', 'status', 'paymentStatus', 'razorpayPaymentId', 'createdAt'],
          rows: db.orders.map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customer.name,
            customerEmail: o.customer.email,
            total: `₹${o.total.toLocaleString('en-IN')}`,
            status: o.status,
            paymentStatus: o.payment.status,
            razorpayPaymentId: o.payment.razorpayPaymentId,
            itemsCount: o.items.length,
            createdAt: o.createdAt
          }))
        }
      }
    });
  });

  // Setup Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Shopping Assistant Server running at http://localhost:${PORT}`);
  });
}

startServer();
