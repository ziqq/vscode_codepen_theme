import { sendMessage } from '../utils/sendMessage.js';
import Category from '../models/Category.js';

// Create category
export const createCategory = async (req, res) => {
  const hasSameCategory = Category.find({ title: req.body.title });

  if (hasSameCategory) {
    return res.status(400).send(sendMessage('Category is exist!'));
  }

  // Create a new product
  const category = new Category({
    title: req.body.title,
    description_full: req.body.description_full,
    description_seo: req.body.description_seo,
    thumbnail: req.body.thumbnail,
  });

  category
    .save()
    .then(() => res.status(201).send(category))
    .catch((err) => res.status(400).send(err));
};
