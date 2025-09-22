const Internship = require('../models/Internship');

const searchInternships = async (req, res) => {
  try {
    const {
      q,
      sector,
      location,
      skills,
      min_stipend,
      remote,
      sort_by = 'relevance',
      sort_order = 'desc',
      limit = 50,
      offset = 0
    } = req.query;

    // Build search query
    const query = { is_active: true };

    // Text search
    if (q) {
      query.$text = { $search: q };
    }

    // Filter by sector
    if (sector) {
      query.sector = new RegExp(sector, 'i');
    }

    // Filter by location
    if (location) {
      query.location = new RegExp(location, 'i');
    }

    // Filter by skills
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query.required_skills = { $in: skillsArray.map(skill => new RegExp(skill, 'i')) };
    }

    // Filter by stipend
    if (min_stipend) {
      query.stipend = { $gte: parseInt(min_stipend) };
    }

    // Filter by remote
    if (remote !== undefined) {
      query.location = remote === 'true' ? 'Remote' : { $ne: 'Remote' };
    }

    // Build sort options
    let sortOptions = {};
    switch (sort_by) {
      case 'stipend':
        sortOptions = { stipend: sort_order === 'asc' ? 1 : -1 };
        break;
      case 'deadline':
        sortOptions = { deadline: sort_order === 'asc' ? 1 : -1 };
        break;
      case 'duration':
        sortOptions = { duration_weeks: sort_order === 'asc' ? 1 : -1 };
        break;
      case 'relevance':
      default:
        if (q) {
          sortOptions = { score: { $meta: 'textScore' } };
        } else {
          sortOptions = { createdAt: -1 };
        }
        break;
    }

    // Execute search
    let internshipsQuery = Internship.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    // Add text score for relevance sorting
    if (q) {
      internshipsQuery = internshipsQuery.select({ score: { $meta: 'textScore' } });
    }

    internshipsQuery = internshipsQuery.sort(sortOptions);

    const internships = await internshipsQuery.exec();
    const total = await Internship.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        internships,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        query: {
          q,
          sector,
          location,
          skills,
          min_stipend,
          remote,
          sort_by,
          sort_order
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

module.exports = {
  searchInternships
};