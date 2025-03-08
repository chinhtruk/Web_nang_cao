const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Trang chủ - Hiển thị danh sách sản phẩm
router.get('/', async (req, res) => {
    try {
        if (!req.session.cart) req.session.cart = []; // Khởi tạo giỏ hàng nếu chưa có
        const products = await Product.find();
        res.render('index', { products, cart: req.session.cart });
    } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
        res.status(500).json({ error: "Không thể tải sản phẩm!" });
    }
});

// Trang chi tiết sản phẩm
router.get('/product/:id', async (req, res) => {
       try {
           const product = await Product.findById(req.params.id);
           if (!product) {
               return res.status(404).send("Không tìm thấy sản phẩm!");
           }
           // Fix lỗi: Truyền cart vào view để tránh lỗi "cart is not defined"
           res.render('product', { product, cart: req.session.cart || [] });
       } catch (error) {
           console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
           res.status(500).send("Lỗi khi lấy thông tin sản phẩm.");
       }
   });

// API Thêm vào giỏ hàng
router.post('/cart/add/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại!" });
        }

        if (!req.session.cart) req.session.cart = [];

        let existingProduct = req.session.cart.find(item => item._id.toString() === req.params.id);
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            req.session.cart.push({ ...product.toObject(), quantity: 1 });
        }

        req.session.save(() => {
            if (req.headers.referer && req.headers.referer.includes('/product/')) {
                return res.redirect(req.headers.referer); // Quay lại trang chi tiết sản phẩm
            }
            res.json({ 
                success: true, 
                cartCount: req.session.cart.reduce((sum, item) => sum + item.quantity, 0) 
            });
        });

    } catch (error) {
        console.error("Lỗi khi thêm vào giỏ hàng:", error);
        res.status(500).json({ success: false, message: "Lỗi khi thêm vào giỏ hàng!" });
    }
});

// API Xóa sản phẩm khỏi giỏ hàng
router.post('/cart/remove/:id', (req, res) => {
    if (!req.session.cart) req.session.cart = [];

    // Xóa sản phẩm trong giỏ hàng
    req.session.cart = req.session.cart.filter(item => item._id.toString() !== req.params.id);

    req.session.save(() => {
        res.json({ 
            success: true, 
            cartCount: req.session.cart.reduce((sum, item) => sum + item.quantity, 0),
            total: req.session.cart.reduce((sum, item) => sum + item.quantity * item.price, 0)
        });
    });
});

// API Cập nhật số lượng sản phẩm trong giỏ hàng
router.post('/cart/update/:id', (req, res) => {
    if (!req.session.cart) req.session.cart = [];

    let product = req.session.cart.find(item => item._id.toString() === req.params.id);
    if (product) {
        product.quantity = parseInt(req.body.quantity);
        if (product.quantity <= 0) {
            req.session.cart = req.session.cart.filter(item => item._id.toString() !== req.params.id);
        }
    }

    req.session.save(() => {
        res.json({
            success: true,
            cartCount: req.session.cart.reduce((sum, item) => sum + item.quantity, 0),
            total: req.session.cart.reduce((sum, item) => sum + item.quantity * item.price, 0)
        });
    });
});

// Trang giỏ hàng
router.get('/cart', (req, res) => {
    if (!req.session.cart) req.session.cart = [];
    const total = req.session.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.render('cart', { cart: req.session.cart, total });
});

module.exports = router;