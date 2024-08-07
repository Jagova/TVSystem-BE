const bcrypt = require("bcrypt");
const { response, request } = require("express");
const { generateJWT } = require("../helpers/jwt");
const { UserRepository } = require("../repositories/user");
const { Validations } = require("../helpers/validations");

const login = async (req = request, res = response) => {

    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({
            msg: "Datos invalidos",
        });
        return;
    }

    const user = await UserRepository.getOne({ username: username });
    if (!user) {
        res.status(401).json({
            msg: "Datos invalidos",
        });
        return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        res.status(401).json({
            msg: "Datos incorrectos",
        });
        return;
    }

    try {
        const { password: _, ...simpleUser } = user.toObject();
        const token = await generateJWT(username);
        res.status(200).json({
            msg: "Login exitoso",
            token: token,
            user: simpleUser
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Internal error",
        });
    }
}



const register = async (req = request, res = response) => {

    const { username, password } = req.body;
    const saltRounds = process.env.SALT_ROUNDS || 10;

    try {
        Validations.username(username);
        Validations.password(password);
    } catch (error) {
        res.status(400).json({
            msg: error.message
        });
        return;
    }

    try {
        const user = await UserRepository.getOne({ username: username });
        if (user) {
            res.status(400).json({
                msg: "Usuario ya existe",
            });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, Number(saltRounds));
        const newUser = await UserRepository.create({
            username: username,
            password: hashedPassword,
            role: "user"
        });

        /*
        const simpleUser = {
            username: newUser.user,
            role: newUser.role,
            id: newUser._id
        }*/

        const { password: _, ...simpleUser } = newUser.toObject();

        res.status(200).json({
            msg: "Usuario creado",
            user: simpleUser
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Internal error",
            error: "Error al crear el usuario"
        });
    }
}

module.exports = {
    login,
    register
}