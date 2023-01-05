import mongoose from "mongoose";

mongoose.set('strictQuery', false);
const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.DB_URI, { 
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const url = `${connection.connection.host}:${connection.connection.port}`;
        console.log(`Connected to MongoDB: ${url}`);
    } catch (error) {
        console.log(`Error: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB