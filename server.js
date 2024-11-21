const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Connection error", err);
    process.exit(1);
  }
}

const db = client.db("your_database_name");
const eventsCollection = db.collection("events");

app.get("/api/v3/app/events", async (req, res) => {
  const eventId = req.query.id;

  if (eventId) {
    try {
      const event = await eventsCollection.findOne({
        _id: new ObjectId(eventId),
      });
      if (!event) {
        return res.status(404).send("Event not found");
      }
      return res.json(event);
    } catch (error) {
      return res.status(500).send("Server error");
    }
  }

  const { type, limit = 5, page = 1 } = req.query;

  if (type !== "latest") {
    return res.status(400).send("Invalid event type");
  }

  try {
    const events = await eventsCollection
      .find({})
      .sort({ schedule: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .toArray();

    res.json(events);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.post("/api/v3/app/events", async (req, res) => {
  const {
    name,
    files,
    tagline,
    schedule,
    description,
    moderator,
    category,
    sub_category,
    rigor_rank,
  } = req.body;

  const event = {
    name,
    tagline,
    schedule,
    description,
    files: files || [],
    moderator,
    category,
    sub_category,
    rigor_rank,
    attendees: [],
  };

  try {
    const result = await eventsCollection.insertOne(event);
    res.json({ id: result.insertedId });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.put("/api/v3/app/events/:id", async (req, res) => {
  const eventId = req.params.id;
  const {
    name,
    files,
    tagline,
    schedule,
    description,
    moderator,
    category,
    sub_category,
    rigor_rank,
  } = req.body;

  const updatedEvent = {
    name,
    tagline,
    schedule,
    description,
    files: files || [],
    moderator,
    category,
    sub_category,
    rigor_rank,
  };

  try {
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      { $set: updatedEvent }
    );
    if (result.matchedCount === 0) {
      return res.status(404).send("Event not found");
    }
    res.json({ message: "Event updated successfully" });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.delete("/api/v3/app/events/:id", async (req, res) => {
  const eventId = req.params.id;

  try {
    const result = await eventsCollection.deleteOne({
      _id: new ObjectId(eventId),
    });
    if (result.deletedCount === 0) {
      return res.status(404).send("Event not found");
    }
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

const startServer = async () => {
  await connectDB();
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
};

startServer();
