export const InvoiceId = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomString = '';


    for (let i = 0; i < 3; i++) {
        randomString += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 6; i++) {
        randomString += Math.floor(Math.random() * 10);
    }

    return randomString;
}

export const orderId = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = letters.charAt(Math.floor(Math.random() * letters.length)); // Random uppercase letter
    let randomNumbers = '';


    for (let i = 0; i < 10; i++) {
        randomNumbers += Math.floor(Math.random() * 10);
    }

    // Concatenate the letter and hyphen with the random numbers
    const formattedId = `${letter}-${randomNumbers}`;

    return formattedId;
}



