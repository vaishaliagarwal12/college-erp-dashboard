const mongoose = require("mongoose");
const { Readable } = require("stream");
const crypto = require("crypto");

let bucket = null;

const getBucket = () => {
  if (!bucket) {
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });
  }
  return bucket;
};

// Stream a Buffer into GridFS and return the file id + metadata
const saveBufferToGridFS = ({ buffer, filename, mimetype, metadata }) => {
  const GridFSBucket = getBucket();

  return new Promise((resolve, reject) => {
    const readable = Readable.from(buffer);
    const uploadStream = GridFSBucket.openUploadStream(filename, {
      contentType: mimetype,
      metadata: metadata || {},
    });

    readable.pipe(uploadStream);

    uploadStream.on("error", reject);
    uploadStream.on("finish", () => {
      resolve({
        id: uploadStream.id,
        filename: uploadStream.filename,
        contentType: uploadStream.contentType,
        length: uploadStream.length,
        metadata: uploadStream.options.metadata,
      });
    });
  });
};

const deleteFromGridFS = (id) => {
  const GridFSBucket = getBucket();
  return GridFSBucket.delete(new mongoose.Types.ObjectId(id));
};

const randomFilename = (original) => {
  const extMatch = /(\.[^./\\]+)$/.exec(original || "");
  const ext = extMatch ? extMatch[1] : "";
  return `${crypto.randomUUID()}${ext}`;
};

module.exports = {
  getBucket,
  saveBufferToGridFS,
  deleteFromGridFS,
  randomFilename,
};
