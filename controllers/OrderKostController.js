const OrderKost = require("../models/OrderKostModel.js");
const Customers = require("../models/CustomerModel.js");
const Kost = require("../models/KostModel.js");

const getOrderKost = async (req, res) => {
    const userId = req.userId;
    try {
        const orderKost = await OrderKost.findAll({
            include: [{
                model: Kost,
                attributes: ['id', 'namaKost', 'alamat', 'hargaPerbulan', 'hargaPertahun', 'tersedia', 'gender', 'fasilitas', 'deskripsi', 'latitude', 'longitude', 'images', 'url'], // Include required attributes from Product model
            }, {
                model: Customers
            }],
            where: { userId }
        });
        const parsedKost = orderKost.map((item) => {
            const kostData = item.kost;
            let fasilitas = kostData?.fasilitas;
            let images = kostData?.images;
            let url = kostData?.url;

            // Parse JSON strings to arrays for fasilitas, images, and url
            try {
                fasilitas = JSON.parse(fasilitas || '[]');
            } catch (error) {
                console.error(`Failed to parse fasilitas for Kost ID ${kostData?.id}:`, error.message);
            }

            try {
                images = JSON.parse(images || '[]');
            } catch (error) {
                console.error(`Failed to parse images for Kost ID ${kostData?.id}:`, error.message);
            }

            try {
                url = JSON.parse(url || '[]');
            } catch (error) {
                console.error(`Failed to parse url for Kost ID ${kostData?.id}:`, error.message);
            }

            return {
                ...item.toJSON(),
                kost: {
                    ...kostData.toJSON(),
                    fasilitas: fasilitas, // Ensure this is an array
                    images: images, // Ensure this is an array
                    url: url, // Ensure this is an array
                },
            };
        });

        res.status(200).json(parsedKost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


const getOrderKostById = async (req, res) => {
    try {
        const response = await OrderKost.findOne({
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

const createOrderKost = async (req, res) => {
    try {
      const { kostId } = req.body;
      const userId = req.userId;
  
      // Validasi kostId
      if (!kostId) {
        return res.status(400).json({
          status: false,
          message: "Kost ID tidak boleh kosong",
        });
      }
  
      // Validasi userId
      if (!userId) {
        return res.status(403).json({
          status: false,
          message: "Unauthorized, user ID tidak valid",
        });
      }
  
      // Pastikan kostId ada di tabel Kost
      const kost = await Kost.findByPk(kostId);
      if (!kost) {
        return res.status(404).json({
          status: false,
          message: "Kost tidak ditemukan",
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
  
      // Tambahkan ke daftar order
      const order = await OrderKost.create({ kostId, userId });
  
      return res.status(201).json({
        status: true,
        message: "Kost berhasil ditambahkan ke order",
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
  

const deleteOrderKost = async (req, res) => {
    try {

        const id = req.params.id;
        
        await OrderKost.destroy({
            where: {
                id: id,
            },
        });
        res.status(200).json({ status: true, message: "Order Kost Deleted" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ status: false, error: 'Internal Server Error' });
    }
};

module.exports = {
    getOrderKost,
    getOrderKostById,
    createOrderKost,
    deleteOrderKost
};
