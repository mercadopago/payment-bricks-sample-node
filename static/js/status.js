const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const paymentId = document.getElementById("payment-id").value;
const mercadopago = new MercadoPago(mercadoPagoPublicKey);
let statusScreenBrickController;

async function loadPaymentForm() {
    const settings = {
        initialization: {
            paymentId,
        },
        callbacks: {
            onReady: () => {
                document.getElementById('loader-container').style.display = 'none'
                console.log('brick ready')
            },
            onError: (error) => {
                alert(JSON.stringify(error))
            },
        },
        locale: 'en',
        customization: {
            visual: {
                style: {
                    theme: 'dark',
                    customVariables: {
                        formBackgroundColor: '#1d2431',
                        baseColor: 'aquamarine'
                    }
                }
            }
        }
    };
    
    const bricksBuilder = mercadopago.bricks();
    statusScreenBrickController = await bricksBuilder.create('statusScreen', 'statusScreenBrick_container', settings);
};

loadPaymentForm();