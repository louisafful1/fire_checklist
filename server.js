import express from "express";
import mongoose from "mongoose";
import "dotenv/config";

const app = express();

// Serve static assets from build

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Database Connection
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('Connected to MongoDB'))
        .catch((err) => console.error('MongoDB connection error:', err));
} else {
    console.error("MONGODB_URI not set");
}



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
