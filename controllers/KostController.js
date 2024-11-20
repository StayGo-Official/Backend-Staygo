const Kost = require("../models/KostModel.js");
const Users = require("../models/UserModel.js");
const path = require("path");
const fs = require("fs");

const getKost = async (req, res) => {
    try {
        const kost = await Kost.findAll({
            include: [{
                model: Users,
                attributes: ['username', 'email', 'role']
            }],
        });

        const parsedKost = kost.map((item) => {
            let fasilitas = item.fasilitas;
            let images = item.images;
            let url = item.url;

            // Jika fasilitas berupa string JSON, parsing menjadi array
            if (typeof fasilitas === 'string') {
                try {
                    fasilitas = JSON.parse(fasilitas); // Parsing string JSON menjadi array
                } catch (error) {
                    console.error(`Failed to parse fasilitas for Kost ID ${item.id}:`, error.message);
                }
            }

            if (typeof images === 'string') {
                try {
                    images = JSON.parse(images); // Parsing string JSON menjadi array
                } catch (error) {
                    console.error(`Failed to parse images for Kost ID ${item.id}:`, error.message);
                }
            }

            if (typeof url === 'string') {
                try {
                    url = JSON.parse(url); // Parsing string JSON menjadi array
                } catch (error) {
                    console.error(`Failed to parse url for Kost ID ${item.id}:`, error.message);
                }
            }

            return {
                ...item.toJSON(),
                fasilitas: fasilitas, // Pastikan ini adalah array
                images: images, // Pastikan ini adalah array
                url: url, // Pastikan ini adalah array
            };
        });

        res.status(200).json(parsedKost);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

const allKost = (req, res) => {
    Kost.findAll()
        .then((data) => {
            // Parsing fasilitas untuk setiap item kost
            const parsedData = data.map((item) => {
                let fasilitas = item.fasilitas;
                let images = item.images;
                let url = item.url;

                // Jika fasilitas berupa string JSON, parsing menjadi array
                if (typeof fasilitas === 'string') {
                    try {
                        fasilitas = JSON.parse(fasilitas); // Parse string JSON menjadi array
                    } catch (error) {
                        console.error(`Failed to parse fasilitas for Kost ID ${item.id}:`, error.message);
                    }
                }

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

                // Return objek dengan fasilitas yang sudah diparse
                return {
                    ...item.toJSON(), // Konversi Sequelize instance ke objek JSON
                    fasilitas: fasilitas, // Pastikan ini adalah array
                    images: images, // Pastikan ini adalah array
                    url: url, // Pastikan ini adalah array
                };
            });

            res.status(200).json({
                status: true,
                message: "Berhasil mengambil data kost",
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

const getKostById = async (req, res) => {
    try {
        const response = await Kost.findOne({
            attributes: [
                'id', 'namaKost', 'alamat', 'hargaPerbulan', 
                'hargaPertahun', 'tersedia', 'gender', 'fasilitas', 
                'deskripsi', 'latitude', 'longitude', 'images', 'url'
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
            return res.status(404).json({ msg: "Kost tidak ditemukan" });
        }

        // Parsing properti fasilitas
        let fasilitas = response.fasilitas;
        let images = response.images;
        let url = response.url;

        if (typeof fasilitas === 'string') {
            try {
                fasilitas = JSON.parse(fasilitas); // Parse string JSON menjadi array
            } catch (error) {
                console.error(`Failed to parse fasilitas for Kost ID ${response.id}:`, error.message);
            }
        }

        if (typeof images === 'string') {
            try {
                images = JSON.parse(images); // Parse string JSON menjadi array
            } catch (error) {
                console.error(`Failed to parse images for Kost ID ${response.id}:`, error.message);
            }
        }

        if (typeof url === 'string') {
            try {
                url = JSON.parse(url); // Parse string JSON menjadi array
            } catch (error) {
                console.error(`Failed to parse url for Kost ID ${response.id}:`, error.message);
            }
        }

        const parsedResponse = {
            ...response.toJSON(), // Konversi Sequelize instance ke JSON object
            fasilitas: fasilitas, // Pastikan ini dalam bentuk array
            images: images, // Pastikan ini dalam bentuk array
            url: url, // Pastikan ini dalam bentuk array
        };

        res.status(200).json(parsedResponse);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Terjadi kesalahan pada server" });
    }
};

const createKost = async (req, res) => {
    console.log("File data: ", req.files); // Debug file input
    console.log("Body data: ", req.body);  // Debug body input

    if (!req.files || !req.files.files || req.files.files.length === 0) 
        return res.status(400).json({ msg: "No Files Uploaded" });

    const {
        namaKost, alamat, hargaPerbulan, hargaPertahun,
        tersedia, gender, fasilitas, deskripsi, latitude, longitude
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
        const kost = await Kost.create({
            namaKost,
            alamat,
            hargaPerbulan,
            hargaPertahun,
            tersedia,
            gender,
            fasilitas: typeof fasilitas === 'string' ? fasilitas.split(',').map(f => f.trim()) : fasilitas,
            deskripsi,
            latitude,
            longitude,
            images: imagePaths,
            url: urls,
            userId: req.userId
        });
        res.status(201).json({ id: kost.id, msg: "Kost berhasil di tambahkan" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};


const updateKost = async (req, res) => {
    const kost = await Kost.findOne({
        where: {
            id: req.params.id,
        },
    });
    if (!kost) return res.status(404).json({ msg: "No Data Found" });

    let fileName = "";
    if (req.files === null) {
        fileName = kost.image;
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

        const filepath = `./public/images/${kost.image}`;
        fs.unlinkSync(filepath);

        file.mv(`./public/images/${fileName}`, (err) => {
            if (err) return res.status(500).json({ msg: err.message });
        });
    }
    const namaKost = req.body.namaKost;
    const alamat = req.body.alamat;
    const hargaPerbulan = req.body.hargaPerbulan;
    const hargaPertahun = req.body.hargaPertahun;
    const tersedia = req.body.tersedia;
    const gender = req.body.gender;
    let fasilitas = req.body.fasilitas;
    const deskripsi = req.body.deskripsi;
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;
    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;

    if (typeof fasilitas === 'string') {
        // Split string seperti "Kasur, Dapur, Wifi" menjadi array ["Kasur", "Dapur", "Wifi"]
        fasilitas = fasilitas.split(',').map(f => f.trim());
    }

    try {
        await Kost.update(
            {
                namaKost: namaKost,
                alamat: alamat,
                hargaPerbulan: hargaPerbulan,
                hargaPertahun: hargaPertahun,
                tersedia: tersedia,
                gender: gender,
                fasilitas: fasilitas,
                deskripsi: deskripsi,
                latitude: latitude,
                longitude: longitude,
                image: fileName,
                url: url,
            },
            {
                where: {
                    id: req.params.id,
                },
            }
        );
        res.status(200).json({ msg: "Kost Updated Successfuly" });
    } catch (error) {
        console.log(error.message);
    }
};

const deleteKost = async (req, res) => {
    const kost = await Kost.findOne({
      where: {
        id: req.params.id,
      },
    });
  
    if (!kost) return res.status(404).json({ msg: "No Data Found" });
  
    try {
      // Cek apakah kost.images adalah array atau string JSON
      let images = kost.images;
      
      // Jika kost.images adalah string, parsing menjadi array
      if (typeof images === 'string') {
        try {
          images = JSON.parse(images); // Parsing string JSON menjadi array
        } catch (error) {
          console.error(`Gagal parsing images untuk Kost ID ${kost.id}:`, error.message);
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
  
      // Jika ada gambar yang gagal dihapus, batalkan penghapusan data kost
      if (!imageDeletionSuccess) {
        return res.status(500).json({ msg: "Gagal menghapus gambar. Data kost tidak dapat dihapus." });
      }
  
      // Hapus data kost dari database
      await Kost.destroy({
        where: {
          id: req.params.id,
        },
      });
  
      res.status(200).json({ msg: "Kost Deleted Successfully" });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ msg: "Server Error" });
    }
  };

  module.exports = {
    getKost,
    allKost,
    getKostById,
    createKost,
    updateKost,
    deleteKost
  };