module.exports = {
    async redirects() {
        return [
            {
                source: "/",
                destination: "/2021",
                permanent: false,
            },
        ];
    },
};
