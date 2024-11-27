const FavoriteOjek = require("../models/FavoriteOjekModel.js");
const Customers = require("../models/CustomerModel.js");
const Ojek = require("../models/OjekModel.js");

const getFavoriteOjek = async (req, res) => {
    const userId = req.userId;
    try {
        const favoriteOjek = await FavoriteOjek.findAll({
            include: [{
                model: Ojek,
                attributes: ['id', 'nama', 'namaLengkap', 'alamat', 'status', 'isRide', 'isFood', 'gender', 'images', 'url']
            }, {
                model: Customers
            }],
            where: { userId }
        });
        const parsedOjek = favoriteOjek.map((item) => {
            const ojekData = item.ojek;
            let images = ojekData?.images;
            let url = ojekData?.url;

            // Parse JSON strings to arrays for images, and url

            try {
                images = JSON.parse(images || '[]');
            } catch (error) {
                console.error(`Failed to parse images for ojek ID ${ojekData?.id}:`, error.message);
            }

            try {
                url = JSON.parse(url || '[]');
            } catch (error) {
                console.error(`Failed to parse url for ojek ID ${ojekData?.id}:`, error.message);
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


const getFavoriteOjekById = async (req, res) => {
    try {
        const response = await FavoriteOjek.findOne({
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

const createFavoriteOjek = async (req, res) => {
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
  
      // Pastikan ojekId ada di tabel ojek
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
  
      // Cek apakah sudah menjadi favorit
      const existingFavorite = await FavoriteOjek.findOne({
        where: { ojekId, userId },
      });
  
      if (existingFavorite) {
        return res.status(200).json({
          status: true,
          message: "Ojek sudah ada di daftar favorit",
          data: existingFavorite,
        });
      }
  
      // Tambahkan ke daftar favorit
      const favorite = await FavoriteOjek.create({ ojekId, userId });
  
      return res.status(201).json({
        status: true,
        message: "Ojek berhasil ditambahkan ke favorit",
        data: favorite,
      });
    } catch (error) {
      console.error("Error saat menambahkan favorit:", error.message);
      return res.status(500).json({
        status: false,
        message: "Terjadi kesalahan, silakan coba lagi",
        error: error.message,
      });
    }
  };

  const checkIfFavorite = async (req, res) => {
    try {
        const { ojekId } = req.params; // Mengambil ojekId dari parameter
        const userId = req.userId; // Mendapatkan userId dari token yang diverifikasi

        // Validasi apakah ojekId dan userId tersedia
        if (!ojekId) {
            return res.status(400).json({
                status: false,
                message: "Ojek ID tidak boleh kosong",
            });
        }

        if (!userId) {
            return res.status(403).json({
                status: false,
                message: "Unauthorized, user ID tidak valid",
            });
        }

        // Cek apakah ojek ada di daftar favorit
        const favorite = await FavoriteOjek.findOne({
            where: { ojekId, userId },
        });

        if (favorite) {
            return res.status(200).json({
                status: true,
                message: "Ojek sudah ada di daftar favorit",
                data: favorite,
            });
        } else {
            return res.status(404).json({
                status: false,
                message: "Ojek belum ada di daftar favorit",
            });
        }
    } catch (error) {
        console.error("Error saat memeriksa favorit:", error.message);
        return res.status(500).json({
            status: false,
            message: "Terjadi kesalahan, silakan coba lagi",
            error: error.message,
        });
    }
};
  

const deleteFavoriteOjek = async (req, res) => {
    try {

        const id = req.params.id;
        
        await FavoriteOjek.destroy({
            where: {
                id: id,
            },
        });
        res.status(200).json({ status: true, message: "Favorite Ojek Deleted" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ status: false, error: 'Internal Server Error' });
    }
};

module.exports = {
    getFavoriteOjek,
    getFavoriteOjekById,
    createFavoriteOjek,
    checkIfFavorite,
    deleteFavoriteOjek
};
