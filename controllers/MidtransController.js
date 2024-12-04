const Midtrans = require("midtrans-client");

const snap = new Midtrans.Snap({
  isProduction: false,
  serverKey: process.env.SECRET,
  clientKey: process.env.NEXT_PUBLIC_CLIENT,
});

const createPayment = async (req, res) => {
  try {
    const { ojekId, nama, price } = req.body;

    const gross_amount = parseInt(price);

    const orderId = Date.now().toString();

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: gross_amount,
      },
      item_details: [
        {
          id: ojekId,
          price: gross_amount,
          quantity: 1,
          name: nama
        },
      ],
      credit_card: {
        secure: true,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    res.status(200).json({
      status: true,
      message: "Success create payment",
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: false,
      message: "Failed to process payment",
      error: error.message,
    });
  }
};

module.exports = {
  createPayment,
};
