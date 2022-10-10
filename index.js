const path = require("path");
const express = require("express");
const mercadopago = require("mercadopago");

const host = process.env.HOST;
if (!host) {
  console.log("Error: host not defined");
  process.exit(1);
}

const mercadoPagoPublicKey = process.env.MERCADO_PAGO_SAMPLE_PUBLIC_KEY;
if (!mercadoPagoPublicKey) {
  console.log("Error: public key not defined");
  process.exit(1);
}

const mercadoPagoAccessToken = process.env.MERCADO_PAGO_SAMPLE_ACCESS_TOKEN;
if (!mercadoPagoAccessToken) {
  console.log("Error: access token not defined");
  process.exit(1);
}

mercadopago.configurations.setAccessToken(mercadoPagoAccessToken);

const app = express();

app.set("view engine", "html");
app.engine("html", require("hbs").__express);
app.set("views", path.join(__dirname, "views"))

app.use(express.urlencoded({ extended: false }));
app.use(express.static("./static"));
app.use(express.json());

app.get("/", function (req, res) {
  res.status(200).render("index", { mercadoPagoPublicKey });
});

app.get("/payment_status", (req, res) => {
  const { payment_id: paymentId } = req.query;
  res.status(200).render("status", { mercadoPagoPublicKey, paymentId });
});

app.get("/preference_id", async function (req, res) {
  const { unitPrice, quantity } = req.query;
  const backUrl = `${host}/payment_status`;

  const preference = {
    back_urls: {
      success: backUrl,
      failure: backUrl,
      pending: backUrl
    },
    auto_return: "approved",
    items: [
      {
        id: "item-ID-1234",
        title: "White t-shirt",
        unit_price: Number(unitPrice),
        quantity: parseInt(quantity)
      }
    ]
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    const preferenceId = response.body.id;
    res.status(201).json({ preferenceId });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error });
  }
});

app.post("/process_payment_card", (req, res) => {
  const { body } = req;

  mercadopago.payment.save(body)
  .then(response => res.status(201).json(formatResponse(response)))
  .catch(error => {
    const { errorMessage, errorStatus } = validateError(error);
    res.status(errorStatus).json({ error_message: errorMessage });
  });
});

app.post("/process_payment_pix", (req, res) => {
  const { body } = req;
  body.external_reference = 'ASD1234',

  mercadopago.payment.create(body)
    .then(response => res.status(201).json(formatResponse(response)))
    .catch(error => {
      const { errorMessage, errorStatus } = validateError(error);
      res.status(errorStatus).json({ error_message: errorMessage });
    });
});

app.post("/process_payment_ticket", (req, res) => {
  const { body } = req;

  mercadopago.payment.create(body)
    .then(response => res.status(201).json(formatResponse(response)))
    .catch(error => {
      const { errorMessage, errorStatus } = validateError(error);
      res.status(errorStatus).json({ error_message: errorMessage });
    });
});

function formatResponse(response) {
  const { response: data } = response;
  return {
    detail: data.status_detail,
    status: data.status,
    id: data.id
  };
}

function validateError(error) {
  let errorMessage = 'Unknown error cause';
  let errorStatus = 400;

  if (error.cause) {
    const sdkErrorMessage = error.cause[0].description;
    errorMessage = sdkErrorMessage || errorMessage;

    const sdkErrorStatus = error.status;
    errorStatus = sdkErrorStatus || errorStatus;
  }

  return { errorMessage, errorStatus };
}

app.listen(8080, () => {
  console.log("The server is now running on port 8080");
});
