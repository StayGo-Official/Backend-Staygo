const Customers = require("../models/CustomerModel.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { blacklistedTokens } = require("../middleware/VerifyToken");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

const getCustomers = async (req, res) => {
  try {
    const customers = await Customers.findAll({
      attributes: [
        "id",
        "username",
        "nama",
        "email",
        "noHp",
        "alamat",
        "ttl",
        "image",
        "url",
      ],
    });
    res.json(customers);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ msg: "Internal Server Error", error: error.message });
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
      where: { id },
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
  const { username, nama, email, noHp, alamat, ttl, password, confPassword } =
    req.body;

  if (password !== confPassword) {
    return res
      .status(400)
      .json({ msg: "Password dan Confirm Password Tidak Cocok" });
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
      nama,
      email,
      noHp,
      alamat,
      ttl,
      password: hashPassword,
    });

    res.status(200).json({
      msg: "Register Berhasil",
      data: {
        user: {
          id: newCustomer.id,
          username: newCustomer.username,
          nama: newCustomer.nama,
          email: newCustomer.email,
          noHp: newCustomer.noHp,
          alamat: newCustomer.alamat,
          ttl: newCustomer.ttl,
        },
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Internal Server Error", error: error.message });
  }
};

const Login = async (req, res) => {
  try {
    const customer = await Customers.findOne({
      where: { email: req.body.email },
    });

    if (!customer)
      return res.status(404).json({ msg: "Email tidak ditemukan" });

    const match = await bcrypt.compare(req.body.password, customer.password);
    if (!match) return res.status(400).json({ msg: "Password Salah" });

    const accessToken = jwt.sign(
      {
        userId: customer.id,
        username: customer.username,
        email: customer.email,
        noHp: customer.noHp,
        alamat: customer.alamat,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      {
        userId: customer.id,
        username: customer.username,
        email: customer.email,
        noHp: customer.noHp,
        alamat: customer.alamat,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    await Customers.update(
      { refresh_token: refreshToken },
      {
        where: { id: customer.id },
      }
    );

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
  const customer = await Customers.findOne({
    where: {
      id: req.params.id,
    },
  });
  if (!customer) return res.status(404).json({ msg: "No Data Found" });

  let fileName = "";

  if (req.files === null) {
    // Check if customer already has an image
    if (!customer.image || customer.image === "null") {
      // Assign a default image if no file and no existing image
      fileName = ""; // Replace with your default image file name
    } else {
      // Use existing image if no file is uploaded
      fileName = customer.image;
    }
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

    // Check if the existing image needs to be removed
    if (customer.image && customer.image !== "null") {
      const filepath = `./public/images/${customer.image}`;
      if (fs.existsSync(filepath)) {
        // Only unlink if the file exists
        fs.unlinkSync(filepath);
      }
    }

    // Move the new file to the public/images directory
    file.mv(`./public/images/${fileName}`, (err) => {
      if (err) return res.status(500).json({ msg: err.message });
    });
  }

  const username = req.body.username;
  const nama = req.body.nama;
  const email = req.body.email;
  const noHp = req.body.noHp;
  const alamat = req.body.alamat;
  const ttl = req.body.ttl;
  const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;

  try {
    await Customers.update(
      {
        username: username,
        nama: nama,
        email: email,
        noHp: noHp,
        alamat: alamat,
        ttl: ttl,
        image: fileName,
        url: url,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );
    res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      imagePath: fileName,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

const changePassword = async (req, res) => {
  const id = req.userId; // Get user ID from JWT token
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      status: false,
      message: "Semua field harus diisi",
      data: {},
    });
  }

  // Check if new password and confirm password match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      status: false,
      message: "Password baru dan konfirmasi password tidak cocok",
      data: {},
    });
  }

  try {
    // Find the customer
    const customer = await Customers.findOne({
      where: { id },
    });

    if (!customer) {
      return res.status(404).json({
        status: false,
        message: "User tidak ditemukan",
        data: {},
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      customer.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        status: false,
        message: "Password saat ini tidak valid",
        data: {},
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    await Customers.update({ password: hashPassword }, { where: { id } });

    res.status(200).json({
      status: true,
      message: "Password berhasil diubah",
      data: {},
    });
  } catch (error) {
    console.log("Error changing password:", error);
    res.status(500).json({
      status: false,
      message: "Terjadi kesalahan, silahkan coba lagi",
      data: {},
    });
  }
};

const Logout = async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];
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
    await Customers.update({ refresh_token: null }, { where: { id } });

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

const deleteCustomer = async (req, res) => {
  const customer = await Customers.findOne({
    where: {
      id: req.params.id,
    },
  });
  if (!customer) return res.status(404).json({ msg: "No Data Found" });

  try {
    const filepath = `./public/images/${customer.image}`;
    fs.unlinkSync(filepath);
    await Customers.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.status(200).json({ msg: "Customer Deleted Successfuly" });
  } catch (error) {
    console.log(error.message);
  }
};

const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  const verificationCode = Math.floor(1000 + Math.random() * 9000);

  try {
    // Check if the customer exists
    const customer = await Customers.findOne({ where: { email } });
    if (!customer) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: {},
      });
    }

    // Update the verification code and isVerified status in the database
    await Customers.update(
      { verificationCode, isVerified: false },
      { where: { email } }
    );

    // Send the verification code to the customer's email
    await sendVerificationEmail(email, verificationCode);

    res.status(200).json({
      status: true,
      message: "Verification code sent to your email",
      data: {},
    });
  } catch (error) {
    console.log("Error sending verification code:", error);
    res.status(500).json({
      status: false,
      message: "Error sending verification code",
      data: {},
    });
  }
};

const verifyEmail = async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    // Find the customer by email
    const customer = await Customers.findOne({ where: { email } });
    if (!customer) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: {},
      });
    }

    // Check if the provided verification code matches the one in the database
    if (customer.verificationCode !== verificationCode) {
      return res.status(401).json({
        status: false,
        message: "Invalid verification code",
        data: {},
      });
    }

    // Update the isVerified status to true
    await Customers.update({ isVerified: true }, { where: { email } });

    res.status(200).json({
      status: true,
      message: "Email verified successfully",
      data: {},
    });
  } catch (error) {
    console.log("Error verifying email:", error);
    res.status(500).json({
      status: false,
      message: "Error verifying email",
      data: {},
    });
  }
};

// Helper function to send the verification email
const sendVerificationEmail = async (email, verificationCode) => {
  // Create a transporter using a service like Gmail or Sendgrid
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  const htmlContent = fs.readFileSync(path.join(__dirname, '../html/email_template.html'), 'utf-8');

  const customizedHtml = htmlContent.replace('{{verificationCode}}', verificationCode);

  // Define the email options
  const mailOptions = {
    from: "StayGo",
    to: email,
    subject: "Email Verification",
    html: customizedHtml,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = {
  getCustomers,
  getProfile,
  updateProfile,
  Register,
  Login,
  changePassword,
  Logout,
  deleteCustomer,
  sendVerificationCode,
  verifyEmail,
};
