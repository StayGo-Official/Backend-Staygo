const FavoriteKost = require("../models/FavoriteKostModel.js");
const Customers = require("../models/CustomerModel.js");
const Kost = require("../models/KostModel.js");

const getFavoriteKost = async (req, res) => {
    const userId = req.userId;
    try {
        const favoriteKost = await FavoriteKost.findAll({
            include: [{
                model: Kost,
                attributes: ['id', 'namaKost', 'alamat', 'hargaPerbulan', 'hargaPertahun', 'tersedia', 'gender', 'fasilitas', 'deskripsi', 'latitude', 'longitude', 'images', 'url'], // Include required attributes from Product model
            }, {
                model: Customers
            }],
            where: { userId }
        });
        const parsedKost = favoriteKost.map((item) => {
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


const getFavoriteKostById = async (req, res) => {
    try {
        const response = await FavoriteKost.findOne({
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

const createFavoriteKost = async (req, res) => {
    try {
        const { kostId } = req.body;
        const userId = req.userId; // Assuming you're using some sort of auth middleware

        // Ensure the kost exists
        const kost = await Kost.findByPk(kostId);
        if (!kost) {
            return res.status(404).json({ error: 'Kost not found' });
        }

        // Check if the kost is already in the user's favorites
        const existingFavoriteKost = await FavoriteKost.findOne({
            where: { kostId, userId }
        });
        if (existingFavoriteKost) {
            return res.status(400).json({ error: 'Kost is already in favorites' });
        }

        // Create new favorite
        const favoriteKost = await FavoriteKost.create({
            kostId,
            userId
        });

        res.status(201).json(favoriteKost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteFavoriteKost = async (req, res) => {
    try {

        const id = req.params.id;
        
        await FavoriteKost.destroy({
            where: {
                id: id,
            },
        });
        res.status(200).json({ msg: "Favorite Kost Deleted" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getFavoriteKost,
    getFavoriteKostById,
    createFavoriteKost,
    deleteFavoriteKost
};
