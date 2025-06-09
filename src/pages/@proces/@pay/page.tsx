import React, { useState } from "react";

type PaymentMethod = "credit" | "debit" | "cash";

// Algoritmo de Luhn para validar el número de tarjeta
const isValidCardNumber = (number: string) => {
    const sanitized = number.replace(/\D/g, "");
    let sum = 0;
    let shouldDouble = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
        let digit = parseInt(sanitized.charAt(i), 10);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return sanitized.length >= 13 && sanitized.length <= 19 && sum % 10 === 0;
};

const Page: React.FC = () => {
    const [method, setMethod] = useState<PaymentMethod>("credit");
    const [cardNumber, setCardNumber] = useState("");
    const [error, setError] = useState("");

    const handlePay = () => {
        if (method === "cash") {
            setError("");
            alert("Pago en efectivo seleccionado.");
            return;
        }
        if (!isValidCardNumber(cardNumber)) {
            setError("El número de tarjeta no es válido.");
            return;
        }
        setError("");
        alert("Pago realizado correctamente.");
    };

    return (
        <div style={{ maxWidth: 400, margin: "0 auto", padding: 24 }}>
            <h2>Pasarela de Pago</h2>
            <div>
                <label>
                    <input
                        type="radio"
                        checked={method === "credit"}
                        onChange={() => setMethod("credit")}
                    />
                    Tarjeta de Crédito
                </label>
                <label style={{ marginLeft: 16 }}>
                    <input
                        type="radio"
                        checked={method === "debit"}
                        onChange={() => setMethod("debit")}
                    />
                    Tarjeta de Débito
                </label>
                <label style={{ marginLeft: 16 }}>
                    <input
                        type="radio"
                        checked={method === "cash"}
                        onChange={() => setMethod("cash")}
                    />
                    Efectivo
                </label>
            </div>
            {(method === "credit" || method === "debit") && (
                <div style={{ marginTop: 16 }}>
                    <input
                        type="text"
                        placeholder="Número de tarjeta"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>
            )}
            {error && (
                <div style={{ color: "red", marginTop: 8 }}>{error}</div>
            )}
            <button
                style={{ marginTop: 24, width: "100%", padding: 12 }}
                onClick={handlePay}
            >
                Pagar
            </button>
        </div>
    );
};

export default Page;