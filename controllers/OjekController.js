const Ojek = require("../models/OjekModel.js");
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

const allOjek = (req, res) => {
    Ojek.findAll()
        .then((data) => {
            // Parsing fasilitas untuk setiap item Ojek
            const parsedData = data.map((item) => {
                let images = item.images;
                let url = item.url;

                if (typeof images === 'string') {
                    try {
                        images = JSON.parse(images); // Parse string JSON menjadi array
                    } catch (error) {
                        console.error(`Failed to parse images for Kost ID ${item.id}:`, error.message);
                    }
                }

                if (typeof url === 'string') {
                    try {
                        url = JSON.parse(url); // Parse string JSON menjadi array
                    } catch (error) {
                        console.error(`Failed to parse url for Kost ID ${item.id}:`, error.message);
                    }
                }

                return {
                    ...item.toJSON(), // Konversi Sequelize instance ke objek JSON
                    images: images, // Pastikan ini adalah array
                    url: url, // Pastikan ini adalah array
                };
            });

            res.status(200).json({
                status: true,
                message: "Berhasil mengambil data Ojek",
                data: parsedData,
            });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({
                status: false,
                message: "Terjadi kesalahan, silahkan coba lagi",
                data: {},
            });
        });
};

const getOjekById = async (req, res) => {
    try {
        const response = await Ojek.findOne({
            attributes: [
                'id', 'nama', 'alamat', 'status', 
                'gender', 'images', 'url'
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
        nama, alamat, status, gender
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
            alamat,
            status,
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
    const ojek = await Ojek.findOne({
        where: {
            id: req.params.id,
        },
    });
    if (!ojek) return res.status(404).json({ msg: "No Data Found" });

    let fileName = "";
    if (req.files === null) {
        fileName = ojek.image;
    } else {
        const file = req.files.file;
        const fileSize = file.data.length;
        const ext = path.extname(file.name);
        fileName = file.md5 + ext;
        const allowedType = [".png", ".jpg", ".jpeg"];

        if (!allowedType.includes(ext.toLowerCase()))
            return res.status(422).json({ msg: "Invalid Images" });
        if (fileSize > 5000000)
            return res.status(422).json({ msg: "Image must be less than 5 MB" });

        const filepath = `./public/images/${ojek.image}`;
        fs.unlinkSync(filepath);

        file.mv(`./public/images/${fileName}`, (err) => {
            if (err) return res.status(500).json({ msg: err.message });
        });
    }
    const nama = req.body.nama;
    const alamat = req.body.alamat;
    const status = req.body.status;
    const gender = req.body.gender;
    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;

    try {
        await Ojek.update(
            {
                nama: nama,
                alamat: alamat,
                status: status,
                gender: gender,
                image: fileName,
                url: url,
            },
            {
                where: {
                    id: req.params.id,
                },
            }
        );
        res.status(200).json({ msg: "Ojek Updated Successfuly" });
    } catch (error) {
        console.log(error.message);
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
    allOjek,
    getOjekById,
    createOjek,
    updateOjek,
    deleteOjek
  };