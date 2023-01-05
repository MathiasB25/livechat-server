import nodemailer from 'nodemailer'

const emailRegister = async data => {
    const { email, username, token } = data

    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Email information

    await transport.sendMail({
        from: '"LiveChat - Aplicación de chatting para gamers" <accounts@livechat.com>',
        to: email,
        subject: 'LiveChat - Confirma tu cuenta',
        text: 'Confirma tu cuenta en LiveChat',
        html: `<p>Hola ${username}! Confirma tu cuenta en LiveChat</p>
            <p>
                Tu cuenta ya esta casi lista, solo debes confirmarla en el siguiente enlace:
                <a href='${process.env.CLIENT_URL}/confirm/${token}'>Comprobar cuenta</a>
            </p>
            <p>Si tu no creaste esta cuenta, puedes ignorar el mensaje</p>
        `
    })
}

const emailResetPassword = async data => {
    const { email, username, token } = data

    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Email information

    await transport.sendMail({
        from: '"LiveChat - Aplicación de chatting para gamers" <accounts@livechat.com>',
        to: email,
        subject: 'LiveChat - Reestablece tu contraseña',
        text: 'Reestablece tu contraseña',
        html: `<p>Hola ${username}! has solicitado reestablecer tu contraseña</p>
            <p>
                Sigue el siguiente enlace para generar una nueva contraseña:
                <a href='${process.env.CLIENT_URL}/reset-password/${token}'>Reestablecer contraseña</a>
            </p>
            <p>Si tu solicitaste esto, puedes ignorar el mensaje</p>
        `
    })
}

export {
    emailRegister,
    emailResetPassword
}