const Ojek = require("../models/OjekModel.js");
const FavoriteOjek = require('../models/FavoriteOjekModel');
const Users = require("../models/UserModel.js");
const path = require("path");
const fs = require("fs");

const getOjek = async (req, res) => {
    try {
        const ojek = await Ojek.findAll({
            include: [{
                model: Users,
                attributes: ['username', 'email', 'role']
            }],
        });

        const parsedOjek = ojek.map((item) => {
            let images = item.images;
            let url = item.url;

            if (typeof images === 'string') {
                try {
                    images = JSON.parse(images); // Parsing string JSON menjadi array
                } catch (error) {
                    console.error(`Failed to parse images for Ojek ID ${item.id}:`, error.message);
                }
            }

            if (typeof url === 'string') {
                try {
                    url = JSON.parse(url); // Parsing string JSON menjadi array
                } catch (error) {
                    console.error(`Failed to parse url for Ojek ID ${item.id}:`, error.message);
                }
            }

            return {
                ...item.toJSON(),
                images: images, // Pastikan ini adalah array
                url: url, // Pastikan ini adalah array
            };
        });

        res.status(200).json(parsedOjek);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

const getOjekMobile = async (req, res) => {
  try {
      // Pastikan req.userId ada dan valid
      if (!req.userId) {
          return res.status(400).json({ msg: 'User not authenticated or no user ID found' });
      }

      const userId = req.userId; // Menggunakan req.userId yang sudah ada dari middleware

      // Ambil semua data Ojek beserta data pengguna yang terkait
      const ojek = await Ojek.findAll({
          include: [{
              model: Users,
              attributes: ['username', 'email', 'role']
          }],
      });

      // Ambil data Ojek yang sudah difavoritkan oleh userId
      const favoriteOjekIds = await FavoriteOjek.findAll({
          where: {
              userId: userId
          },
          attributes: ['ojekId']
      });

      // Mengubah array of FavoriteOjek ke dalam array of ojekIds untuk memudahkan pengecekan
      const favoriteOjekIdList = favoriteOjekIds.map(fav => fav.ojekId);

      const parsedOjek = ojek.map((item) => {
          let images = item.images;
          let url = item.url;

          if (typeof images === 'string') {
              try {
                  images = JSON.parse(images); // Parsing string JSON menjadi array
              } catch (error) {
                  console.error(`Failed to parse images for Ojek ID ${item.id}:`, error.message);
              }
          }

          if (typeof url === 'string') {
              try {
                  url = JSON.parse(url); // Parsing string JSON menjadi array
              } catch (error) {
                  console.error(`Failed to parse url for Ojek ID ${item.id}:`, error.message);
              }
          }

          // Cek apakah Ojek ini ada di dalam daftar favorite
          const isFavorite = favoriteOjekIdList.includes(item.id);

          return {
              ...item.toJSON(),
              images: images, // Pastikan ini adalah array
              url: url, // Pastikan ini adalah array
              isFavorite: isFavorite // Menambahkan atribut isFavorite
          };
      });

      res.status(200).json(parsedOjek);
  } catch (error) {
      console.error("Error in getOjek:", error);
      res.status(500).json({ msg: error.message });
  }
};

const getOjekById = async (req, res) => {
    try {
        const response = await Ojek.findOne({
            attributes: [
                'id', 'nama', 'namaLengkap', 'alamat', 'status', 
                'isRide', 'isFood', 'gender', 'images', 'url'
            ],
            where: {
                id: req.params.id
            },
            include: {
                model: Users,
                attributes: ['username', 'email', 'role']
            }
        });

        if (!response) {
            return res.status(404).json({ msg: "Ojek tidak ditemukan" });
        }

        let images = response.images;
        let url = response.url;

        if (typeof images === 'string') {
            try {
                images = JSON.parse(images); // Parse string JSON menjadi array
            } catch (error) {
                console.error(`Failed to parse images for Ojek ID ${response.id}:`, error.message);
            }
        }

        if (typeof url === 'string') {
            try {
                url = JSON.parse(url); // Parse string JSON menjadi array
            } catch (error) {
                console.error(`Failed to parse url for Ojek ID ${response.id}:`, error.message);
            }
        }

        const parsedResponse = {
            ...response.toJSON(), // Konversi Sequelize instance ke JSON object
            images: images, // Pastikan ini dalam bentuk array
            url: url, // Pastikan ini dalam bentuk array
        };

        res.status(200).json(parsedResponse);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Terjadi kesalahan pada server" });
    }
};

const createOjek = async (req, res) => {
    console.log("File data: ", req.files); // Debug file input
    console.log("Body data: ", req.body);  // Debug body input

    if (!req.files || !req.files.files || req.files.files.length === 0) 
        return res.status(400).json({ msg: "No Files Uploaded" });

    const {
        nama, namaLengkap, alamat, status, isRide, isFood, gender
    } = req.body;

    const files = req.files.files; // Access the uploaded files
    const allowedType = ['.png', '.jpg', '.jpeg'];
    const imagePaths = [];
    const urls = [];

    for (const file of files) {
        const fileSize = file.data.length;
        const ext = path.extname(file.name);
        const fileName = `${file.md5}${ext}`;
        const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;

        if (!allowedType.includes(ext.toLowerCase()))
            return res.status(422).json({ msg: `Invalid Image: ${file.name}` });

        if (fileSize > 5000000)
            return res.status(422).json({ msg: `Image ${file.name} must be less than 5 MB` });

        file.mv(`./public/images/${fileName}`, (err) => {
            if (err) return res.status(500).json({ msg: err.message });
        });

        imagePaths.push(fileName);
        urls.push(url);
    }

    try {
        const ojek = await Ojek.create({
            nama,
            namaLengkap,
            alamat,
            status,
            isRide,
            isFood,
            gender,
            images: imagePaths,
            url: urls,
            userId: req.userId
        });
        res.status(201).json({ id: ojek.id, msg: "Ojek berhasil di tambahkan" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};


const updateOjek = async (req, res) => {
    // Ambil gambar yang dihapus dari request
    const removedImages = JSON.parse(req.body.removedImages || '[]');
  
    const ojek = await Ojek.findOne({
      where: {
        id: req.params.id,
      },
    });
    if (!ojek) return res.status(404).json({ msg: "No Data Found" });
  
    let imagePaths = Array.isArray(ojek.images) ? kost.images : JSON.parse(ojek.images || '[]');
    let urls = [];
    const allowedType = ['.png', '.jpg', '.jpeg'];
  
    // Proses gambar lama dan tambahkan ke array jika diperlukan
    imagePaths.forEach(image => {
      const url = `${req.protocol}://${req.get("host")}/images/${image}`;
      urls.push(url);
    });
  
    // Proses file baru
    if (req.files && req.files.files) {
      const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
  
      for (const file of files) {
        const fileSize = file.data.length;
        const ext = path.extname(file.name);
        const fileName = file.md5 + ext;
  
        if (!allowedType.includes(ext.toLowerCase()))
          return res.status(422).json({ msg: `Invalid Image: ${file.name}` });
        if (fileSize > 5000000)
          return res.status(422).json({ msg: `Image ${file.name} must be less than 5 MB` });
  
        const filepath = `./public/images/${fileName}`;
  
        file.mv(filepath, (err) => {
          if (err) return res.status(500).json({ msg: err.message });
        });
  
        // Tambahkan file dan URL baru ke array
        const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;
        imagePaths.push(fileName);
        urls.push(url);
      }
    }
  
    // Hapus gambar yang sudah tidak digunakan
    removedImages.forEach((image) => {
      const imagePath = `./public/images/${image}`;
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);  // Menghapus gambar dari server
      }
      imagePaths = imagePaths.filter((img) => img !== image);  // Filter gambar yang dihapus
      urls = urls.filter((url) => !url.includes(image));  // Filter URL gambar yang dihapus
    });
  
    // Update data kost
    const { nama, namaLengkap, alamat, status, isRide, isFood, gender, } = req.body;
  
    try {
      await Ojek.update(
        {
          nama,
          namaLengkap,
          alamat,
          status,
          isRide,
          isFood,
          gender,
          images: imagePaths,
          url: urls,
        },
        {
          where: {
            id: req.params.id,
          },
        }
      );
      res.status(200).json({ msg: "Ojek Updated Successfully" });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ msg: "Internal Server Error" });
    }
  };

const deleteOjek = async (req, res) => {
    const ojek = await Ojek.findOne({
        where: {
          id: req.params.id,
        },
      });
    
      if (!ojek) return res.status(404).json({ msg: "No Data Found" });
    
      try {
        // Cek apakah ojek.images adalah array atau string JSON
        let images = ojek.images;
        
        // Jika ojek.images adalah string, parsing menjadi array
        if (typeof images === 'string') {
          try {
            images = JSON.parse(images); // Parsing string JSON menjadi array
          } catch (error) {
            console.error(`Gagal parsing images untuk ojek ID ${ojek.id}:`, error.message);
            return res.status(500).json({ msg: "Gagal menghapus gambar, format data gambar salah." });
          }
        }
    
        // Menyimpan status keberhasilan penghapusan gambar
        let imageDeletionSuccess = true;
    
        // Menghapus gambar
        for (const image of images) {
          // Membuat path absolut ke file gambar
          const filepath = path.join(__dirname, '..', 'public', 'images', image);
    
          try {
            // Menghapus file menggunakan fs.promises.unlink
            await fs.promises.unlink(filepath);
          } catch (err) {
            console.error(`Gagal menghapus file: ${filepath}`, err);
            imageDeletionSuccess = false;
          }
        }
    
        // Jika ada gambar yang gagal dihapus, batalkan penghapusan data ojek
        if (!imageDeletionSuccess) {
          return res.status(500).json({ msg: "Gagal menghapus gambar. Data ojek tidak dapat dihapus." });
        }
    
        // Hapus data ojek dari database
        await Ojek.destroy({
          where: {
            id: req.params.id,
          },
        });
    
        res.status(200).json({ msg: "Ojek Deleted Successfully" });
      } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: "Server Error" });
      }
  };

  module.exports = {
    getOjek,
    getOjekMobile,
    getOjekById,
    createOjek,
    updateOjek,
    deleteOjek
  };