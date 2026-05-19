const axios = require("axios");

async function test() {
  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      email: "admin@glamourbeauty.com",
      password: "password123"
    });
    const token = res.data.token;
    console.log("Token:", token);

    // Get products
    const pRes = await axios.get("http://localhost:5000/api/products");
    const products = pRes.data;
    if (products.length > 0) {
      console.log("Deleting product:", products[0]._id);
      const del = await axios.delete(`http://localhost:5000/api/products/${products[0]._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Deleted:", del.data);
    } else {
      console.log("No products to delete.");
    }
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

test();
