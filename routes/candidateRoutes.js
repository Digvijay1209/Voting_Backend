const express = require('express');
const router = express.Router();

const User = require('../models/user');
const { jwtAuthMiddleware, generateToken } = require('../jwt');
const Candidate = require('../models/candidate');

const checkAdminRole = async (userID) => {
    try {
        const user = await User.findById(userID); 
        if (user.role === 'admin') return true;
    } catch (err) {
        return false;
    }
};

router.post('/', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!(await checkAdminRole(req.user.id))) 
            return res.status(403).json({ message: 'user does not have admin role' });
            const { party } = req.body; 

           
            const existingCandidate = await Candidate.findOne({ party });
            if (existingCandidate) {
                return res.status(400).json({ message: 'A candidate from this party already exists.' });
            }

        const data = req.body;
        const newCandidate = new Candidate(data);
        const response = await newCandidate.save();
        console.log('data saved');
        res.status(200).json({ response: response });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:candidateID', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!(await checkAdminRole(req.user.id))) // Added await
            return res.status(403).json({ message: 'user does not have admin role' });

        const candidateID = req.params.candidateID;
        const updatedCandidateData = req.body;

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true,
            runValidators: true,
        });
        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate data updated');
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/:candidateID', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!(await checkAdminRole(req.user.id))) 
            return res.status(403).json({ message: 'user does not have admin role' });

        const candidateID = req.params.candidateID;

        const response = await Candidate.findByIdAndDelete(candidateID);

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate deleted');
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/vote/:candidateID', jwtAuthMiddleware, async (req, res) => {
    
    const candidateID = req.params.candidateID; 
    const userId = req.user.id; 

    console.log(req.params);
    try {
        console.log("temp:",req.params);
        const candidate = await Candidate.findById(candidateID);
        if (!candidate) {
            console.log('122');
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const user = await User.findById(userId);
        if (!user) {
            console.log('2');
            return res.status(404).json({ message: 'user not found' });
        }

        if (user.role === 'admin') {
            console.log('3');
            return res.status(403).json({ message: 'admin is not allowed' });
        }

        if (user.isVoted) {
            console.log('4');
            return res.status(400).json({ message: 'You have already voted' });
        }
        console.log('5');
        candidate.votes.push({ user: userId });
        candidate.voteCount++;
        await candidate.save();

        user.isVoted = true;
        await user.save();
        return res.status(200).json({ message: 'Vote recorded successfully' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/vote/count',jwtAuthMiddleware,async (req, res) => {
    console.log('Fetching vote counts...');
    try {
      
        const candidates = await Candidate.find().sort({ voteCount: 'desc' });
        console.log('Fetched candidates:', candidates); 

        const voteRecord = candidates.map((data) => ({
            party: data.party,
            voteCount: data.voteCount,
        }));
       
        return res.status(200).json(voteRecord);
    } catch (err) {
        console.error('Error fetching vote counts:', err.message);
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/',jwtAuthMiddleware,async (req, res) => {
    try {
        const candidates = await Candidate.find({}, 'name party age _id');
        res.status(200).json(candidates);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
