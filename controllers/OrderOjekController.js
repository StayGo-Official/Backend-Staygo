const OrderOjek = require("../models/OrderOjekModel.js");
const Customers = require("../models/CustomerModel.js");
const Ojek = require("../models/OjekModel.js");

const getOrderOjek = async (req, res) => {
    const userId = req.userId;
    try {
        const orderOjek = await OrderOjek.findAll({
            include: [{
                model: Ojek,
                attributes: ['id', 'nama', 'namaLengkap', 'alamat', 'status', 'isRide', 'isFood', 'gender', 'images', 'url'], // Include required attributes from Product model
            }, {
                model: Customers
            }],
            where: { userId }
        });
        const parsedOjek = orderOjek.map((item) => {
            const ojekData = item.ojek;
            let images = ojekData?.images;
            let url = ojekData?.url;

            try {
                images = JSON.parse(images || '[]');
            } catch (error) {
                console.error(`Failed to parse images for Ojek ID ${ojekData?.id}:`, error.message);
            }

            try {
                url = JSON.parse(url || '[]');
            } catch (error) {
                console.error(`Failed to parse url for Ojek ID ${ojekData?.id}:`, error.message);
            }

            return {
                ...item.toJSON(),
                ojek: {
                    ...ojekData.toJSON(),
                    images: images, // Ensure this is an array
                    url: url, // Ensure this is an array
                },
            };
        });

        res.status(200).json(parsedOjek);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


const getOrderOjekById = async (req, res) => {
    try {
        const response = await OrderOjek.findOne({
            where: {
                id: req.params.id,
            },
            include: [{
                model: Customers,
                attributes: ['username', 'email']
            }],
        });
        res.status(200).json(response);
    } catch (error) {
        console.log(error.message);
    }
};

const createOrderOjek = async (req, res) => {
    try {
      const { ojekId } = req.body;
      const userId = req.userId;
  
      // Validasi ojekId
      if (!ojekId) {
        return res.status(400).json({
          status: false,
          message: "Ojek ID tidak boleh kosong",
        });
      }
  
      // Validasi userId
      if (!userId) {
        return res.status(403).json({
          status: false,
          message: "Unauthorized, user ID tidak valid",
        });
      }
  
      const ojek = await Ojek.findByPk(ojekId);
      if (!ojek) {
        return res.status(404).json({
          status: false,
          message: "Ojek tidak ditemukan",
        });
      }
  
      // Pastikan userId ada di tabel Customers
      const customer = await Customers.findByPk(userId);
      if (!customer) {
        return res.status(404).json({
          status: false,
          message: "User tidak ditemukan",
        });
      }
  
      // Cek apakah sudah menjadi order
      const existingOrder = await OrderOjek.findOne({
        where: { ojekId, userId },
      });
  
      // Tambahkan ke daftar order
      const order = await OrderOjek.create({ ojekId, userId });
  
      return res.status(201).json({
        status: true,
        message: "Ojek berhasil ditambahkan ke order",
        data: order,
      });
    } catch (error) {
      console.error("Error saat menambahkan order:", error.message);
      return res.status(500).json({
        status: false,
        message: "Terjadi kesalahan, silakan coba lagi",
        error: error.message,
      });
    }
  };
  

const deleteOrderOjek = async (req, res) => {
    try {

        const id = req.params.id;
        
        await OrderOjek.destroy({
            where: {
                id: id,
            },
        });
        res.status(200).json({ status: true, message: "Order Ojek Deleted" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ status: false, error: 'Internal Server Error' });
    }
};

module.exports = {
    getOrderOjek,
    getOrderOjekById,
    createOrderOjek,
    deleteOrderOjek
};
