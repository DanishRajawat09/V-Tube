import { PORT } from "../config/env.js";
import { app } from "./app.js";
import connectDB from "./db/connectBD.js";

connectDB()
  .then(() => {

    app.on("error" , (error) => { 
        console.log("app is strugguling to talk to database" , error);
        throw error
     })

    app.listen(PORT || 8000, () => {
      console.log(`server running on : http://localhost:${PORT} `);
    });
  })
  .catch((error) => {
    console.log("Mongodb Connection Failed !!!", error);
  });
