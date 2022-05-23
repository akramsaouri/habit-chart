module.exports = {
    async redirects() {
        return [
            {
                source: "/",
                destination: "/2022",
                permanent: false,
            },
        ];
    },
};
