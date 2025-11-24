const invoke = require('../invoke');
const query = require('../query');
const responses = require('../utils/responses');

exports.getClaimsByStatus = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const status = req.query.status;
    const result = await query.getQuery('getClaimsByStatus', { status }, userId);
    // Parse the JSON string result to return as array
    let claims = [];
    try {
      claims = JSON.parse(result);
      // Ensure claims is an array
      if (!Array.isArray(claims)) {
        claims = [];
      }
    } catch (parseError) {
      console.error('Error parsing claims:', parseError);
      claims = [];
    }
    res.status(200).send(responses.ok(claims));
  } catch(err){ next(err); }
};

exports.getClaimsByPatient = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const patientId = req.params.patientId;
    const result = await query.getQuery('getClaimsByPatient', { patientId }, userId);
    // Parse the JSON string result to return as array
    let claims = [];
    try {
      claims = JSON.parse(result);
      // Ensure claims is an array
      if (!Array.isArray(claims)) {
        claims = [];
      }
    } catch (parseError) {
      console.error('Error parsing claims:', parseError);
      claims = [];
    }
    res.status(200).send(responses.ok(claims));
  } catch(err){ next(err); }
};

exports.getClaimsByDoctor = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const doctorId = req.params.doctorId;
    const result = await query.getQuery('getClaimsByDoctor', { doctorId }, userId);
    // Parse the JSON string result to return as array
    let claims = [];
    try {
      claims = JSON.parse(result);
      // Ensure claims is an array
      if (!Array.isArray(claims)) {
        claims = [];
      }
    } catch (parseError) {
      console.error('Error parsing claims:', parseError);
      claims = [];
    }
    res.status(200).send(responses.ok(claims));
  } catch(err){ next(err); }
};

exports.getClaimsByHospital = async (req,res,next) => {
  try{
    const userId = req.user.id;
    const hospitalId = req.params.hospitalId;
    const result = await query.getQuery('getClaimsByHospital', { hospitalId }, userId);
    // Parse the JSON string result to return as array
    let claims = [];
    try {
      claims = JSON.parse(result);
      // Ensure claims is an array
      if (!Array.isArray(claims)) {
        claims = [];
      }
    } catch (parseError) {
      console.error('Error parsing claims:', parseError);
      claims = [];
    }
    res.status(200).send(responses.ok(claims));
  } catch(err){ next(err); }
};