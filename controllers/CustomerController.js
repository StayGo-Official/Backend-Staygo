const Customers = require("../models/CustomerModel.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { updateUsers } = require("./UserController.js");
const { blacklistedTokens } = require("../middleware/VerifyToken");

const getCustomers = async (req, res) => {
  try {
    const customers = await Customers.findAll({
      attributes: ["id", "username", "email", "noHp", "alamat"],
    });
    res.json(customers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
};

const getProfile = async (req, res) => {
  const id = req.userId;

  if (!id) {
    return res.status(400).json({
      status: false,
      message: "User ID tidak valid atau tidak ditemukan",
      data: {},
    });
  }

  try {
    const customer = await Customers.findOne({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: {},
      });
    }

    res.status(200).json({
      status: true,
      message: "Berhasil mengambil profil user",
      data: customer,
    });
  } catch (err) {
    console.log("Error fetching profile:", err);
    res.status(500).json({
      status: false,
      message: "Terjadi kesalahan, silahkan coba lagi",
      data: {},
    });
  }
};

const Register = async (req, res) => {
  const { username, email, noHp, alamat, password, confPassword } = req.body;

  if (password !== confPassword) {
    return res.status(400).json({ msg: "Password dan Confirm Password Tidak Cocok" });
  }

  const existingEmail = await Customers.findOne({ where: { email } });
  if (existingEmail) {
    return res.status(409).json({ msg: "Email sudah terdaftar" });
  }

  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(password, salt);

  try {
    const newCustomer = await Customers.create({
      username,
      email,
      noHp,
      alamat,
      password: hashPassword,
    });

    res.status(200).json({
      msg: "Register Berhasil",
      data: {
        user: {
          id: newCustomer.id,
          username: newCustomer.username,
          email: newCustomer.email,
          noHp: newCustomer.noHp,
          alamat: newCustomer.alamat,
        },
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
};

const Login = async (req, res) => {
  try {
    const customer = await Customers.findOne({
      where: { email: req.body.email },
    });

    if (!customer) return res.status(404).json({ msg: "Email tidak ditemukan" });

    const match = await bcrypt.compare(req.body.password, customer.password);
    if (!match) return res.status(400).json({ msg: "Password Salah" });

    const accessToken = jwt.sign(
      { userId: customer.id, username: customer.username, email: customer.email, noHp: customer.noHp, alamat: customer.alamat },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { userId: customer.id, username: customer.username, email: customer.email, noHp: customer.noHp, alamat: customer.alamat },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    await Customers.update({ refresh_token: refreshToken }, {
      where: { id: customer.id }
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: true,
      message: "Berhasil login",
      data: { user: customer, accessToken },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Terjadi kesalahan, silahkan coba lagi",
      data: {},
    });
  }
};

const updateProfile = async (req, res) => {
  const id = req.userId;

  try {
    const customer = await Customers.findOne({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { username, email } = req.body;

    customer.username = username || customer.username;
    customer.email = email || customer.email;
    // customer.alamat = alamat || customer.alamat;
    // customer.idKecamatan = idKecamatan || customer.idKecamatan;

    await customer.save();

    res.status(200).json({ data: customer });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan, silahkan coba lagi', error: error.message });
  }
};

const Logout = async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  const id = req.userId;

  if (!token) {
    return res.status(400).json({
      status: false,
      message: "Token tidak ditemukan. Silakan login ulang.",
      data: {},
    });
  }

  if (!id) {
    return res.status(400).json({
      status: false,
      message: "User ID tidak ditemukan. Silakan login ulang.",
      data: {},
    });
  }

  try {
    // Hapus refresh token dari database
    await Customers.update(
      { refresh_token: null },
      { where: { id } }
    );

    // Tambahkan access token ke blacklist
    blacklistedTokens.add(token);

    res.status(200).json({
      status: true,
      message: "Berhasil logout",
      data: {},
    });
  } catch (error) {
    console.log("Error saat logout:", error.message);
    res.status(500).json({
      status: false,
      message: "Terjadi kesalahan, silahkan coba lagi",
      data: {},
    });
  }
};


module.exports = {
  getCustomers,
  getProfile,
  updateProfile,
  Register,
  Login,
  Logout
};
