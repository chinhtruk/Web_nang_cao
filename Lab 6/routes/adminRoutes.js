const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Product = require('../models/Product');

// Cấu hình Multer để upload ảnh
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Trang quản lý admin
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.render('admin', { products });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Trang thêm sản phẩm
router.get('/add', (req, res) => {
    res.render('addProduct');
});

// Thêm sản phẩm mới
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { name, price, description } = req.body;
        if (!req.file) {
            return res.status(400).send("Bạn cần tải lên một hình ảnh.");
        }
        const imagePath = '/uploads/' + req.file.filename;
        const product = new Product({ name, price, description, image: imagePath });
        await product.save();
        res.redirect('/admin');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trang chỉnh sửa sản phẩm
router.get('/edit/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send("Sản phẩm không tồn tại.");
        }
        res.render('editProduct', { product });
    } catch (error) {
        res.status(500).send("Lỗi khi tải trang chỉnh sửa.");
    }
});

// Cập nhật sản phẩm
router.post('/edit/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, price, description } = req.body;
        const updateData = { name, price, description };

        if (req.file) {
            updateData.image = '/uploads/' + req.file.filename;
        }

        await Product.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/admin');
    } catch (error) {
        res.status(500).send("Lỗi khi cập nhật sản phẩm.");
    }
});

// Xóa sản phẩm
router.post('/delete/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;