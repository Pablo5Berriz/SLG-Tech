const verifySession = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ message: "Session expirée. Veuillez vous reconnecter." });
    }
    next();
};

module.exports = verifySession;