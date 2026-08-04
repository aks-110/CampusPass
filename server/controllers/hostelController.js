const { Hostel, User } = require('../models/sql/associations');

exports.createHostel = async (req, res) => {
    try {
        const { name, capacity } = req.body;
        const hostel = await Hostel.create({ name, capacity });
        
        const hostelJson = hostel.toJSON();
        hostelJson._id = hostelJson.id;

        res.status(201).json({ message: 'Hostel created successfully', hostel: hostelJson });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating hostel', error: error.message });
    }
};

exports.getAllHostels = async (req, res) => {
    try {
        const hostels = await Hostel.findAll({
            include: [{ model: User, as: 'wardenUser', attributes: ['name', 'email'] }]
        });
        
        // Map id to _id for client compatibility
        const mappedHostels = hostels.map(h => {
            const json = h.toJSON();
            json._id = json.id;
            if (json.wardenUser) {
                json.wardenId = {
                    _id: json.wardenId,
                    name: json.wardenUser.name,
                    email: json.wardenUser.email
                };
            }
            return json;
        });

        res.status(200).json(mappedHostels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteHostel = async (req, res) => {
    try {
        const { hostelId } = req.params;
        await Hostel.destroy({ where: { id: hostelId } });
        res.status(200).json({ message: 'Hostel deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting hostel', error: error.message });
    }
};

exports.assignWarden = async (req, res) => {
    try {
        const { hostelId } = req.params;
        const { wardenId } = req.body;
        
        await Hostel.update({ wardenId }, { where: { id: hostelId } });
        const hostel = await Hostel.findByPk(hostelId);
        
        const hostelJson = hostel.toJSON();
        hostelJson._id = hostelJson.id;

        res.status(200).json({ message: 'Warden assigned to hostel', hostel: hostelJson });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error assigning warden', error: error.message });
    }
};
