const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago(mercadoPagoPublicKey);
let paymentBrickController;

async function loadPaymentForm() {
    const productCost = document.getElementById('amount').value;
    const unitPrice = document.getElementById('unit-price').innerText;
    const quantity = document.getElementById('quantity').value;

    const preferenceId = await getPreferenceId(unitPrice, quantity);

    const settings = {
        initialization: {
            amount: productCost,
            preferenceId
        },
        callbacks: {
            onReady: () => {
                document.getElementById('loader-container').style.display = 'none'
                console.log('brick ready')
            },
            onError: (error) => {
                alert(JSON.stringify(error))
            },
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                return proccessPayment({ selectedPaymentMethod, formData })
            }
        },
        locale: 'en',
        customization: {
            paymentMethods: {
                creditCard: 'all',
                debitCard: 'all',
                /*
                    If some of the following payment methods is not valid for your country,
                    the Brick will show a warning message in the browser console
                */
                ticket: 'all',
                atm: 'all',
                bankTransfer: 'all',
                mercadoPago: 'all',
            },
            visual: {
                style: {
                    theme: 'dark',
                    customVariables: {
                        formBackgroundColor: '#1d2431',
                        baseColor: 'aquamarine'
                    }
                }
            }
        },
    }

    const bricks = mercadopago.bricks();
    paymentBrickController = await bricks.create('payment', 'mercadopago-bricks-contaner__Payment', settings);
};

const getPreferenceId = async (unitPrice, quantity) => {
    const response = await fetch(`/preference_id?unitPrice=${unitPrice}&quantity=${quantity}`);
    const { preferenceId } = await response.json();
    return preferenceId;
};

const proccessPayment = ({ selectedPaymentMethod, formData }) => {
    return new Promise((resolve, reject) => {
        if (selectedPaymentMethod === 'wallet_purchase' || selectedPaymentMethod === 'onboarding_credits') {
            // wallet_purchase and onboarding_credits does not need to be sent to backend
            navToWallet();
            resolve();
        } else {
            /*
                Here you can add properties to formData if you want to.

                - For Peru, 'description' is mandatory for 'pagoefectivo_atm' payment method.
                
                - For Colombia, 'description', 'ip_address' and 'callback_url' are mandatory for 'pse' payment method,
                  but the two last mentioned fields, we recommend adding in the backend.
            */
            formData.description = document.getElementById('product-name').innerText

            fetch('process_payment', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ selectedPaymentMethod, formData })
            })
                .then(response => response.json())
                .then((json) => {
                    const { error_message } = json;
                    if(error_message) {
                        alert(`Error: ${JSON.stringify(error_message)}`)
                        reject();
                    } else {
                        resolve();
                        window.location = `/payment_status?payment_id=${json.id}`
                    }
                })
                .catch((error) => {
                    console.error(error)
                    reject();
                })
        }
    });
}

// Handle transitions
document.getElementById('checkout-btn').addEventListener('click', function () {
    $('.container__cart').fadeOut(500);
    setTimeout(() => {
        loadPaymentForm();
        $('.container__payment').show(500).fadeIn();
    }, 500);
});

document.getElementById('go-back').addEventListener('click', function () {
    $('.container__payment').fadeOut(500);
    setTimeout(() => { $('.container__cart').show(500).fadeIn(); }, 500);
});

function navToWallet() {
    $('.container__payment').fadeOut(500);
    setTimeout(() => {
        loadPaymentForm();
        $('.container__result').show(500).fadeIn();
    }, 500);
};

// Handle price update
function updatePrice() {
    let quantity = document.getElementById('quantity').value;
    let unitPrice = document.getElementById('unit-price').innerText;
    let amount = parseInt(unitPrice) * parseInt(quantity);

    document.getElementById('cart-total').innerText = '$ ' + amount;
    document.getElementById('summary-price').innerText = '$ ' + unitPrice;
    document.getElementById('summary-quantity').innerText = quantity;
    document.getElementById('summary-total').innerText = '$ ' + amount;
    document.getElementById('amount').value = amount;
};

document.getElementById('quantity').addEventListener('change', updatePrice);
updatePrice();