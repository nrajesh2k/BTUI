let dropinInstance;
const submitButton = document.getElementById('submit-button');
const resultDiv = document.getElementById('result');

function showResult(message, isError) {
  resultDiv.textContent = message;
  resultDiv.className = isError ? 'error' : 'success';
}

async function init() {
  submitButton.disabled = true;

  const res = await fetch('/client_token');
  const { clientToken } = await res.json();

  braintree.dropin.create(
    {
      authorization: clientToken,
      container: '#dropin-container',
      // Uncomment to enable additional payment methods once configured
      // paypal: { flow: 'checkout', amount: '10.00', currency: 'USD' },
    },
    (err, instance) => {
      if (err) {
        console.error(err);
        showResult('Failed to load payment form.', true);
        return;
      }
      dropinInstance = instance;
      submitButton.disabled = false;
    }
  );
}

submitButton.addEventListener('click', async () => {
  if (!dropinInstance) return;
  submitButton.disabled = true;

  dropinInstance.requestPaymentMethod(async (err, payload) => {
    if (err) {
      console.error(err);
      showResult(err.message || 'Could not tokenize payment method.', true);
      submitButton.disabled = false;
      return;
    }

    const amount = document.getElementById('amount').value;

    try {
      const res = await fetch('/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodNonce: payload.nonce,
          amount,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showResult(`Payment successful! Transaction ID: ${data.transactionId}`, false);
      } else {
        showResult(data.message || 'Payment failed.', true);
      }
    } catch (e) {
      console.error(e);
      showResult('Network error while processing payment.', true);
    } finally {
      submitButton.disabled = false;
    }
  });
});

init();
