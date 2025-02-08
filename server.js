const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const xml2js = require('xml2js');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 5000;

// Enable CORS
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/xmlUpload', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start the server only after MongoDB is connected
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// MongoDB Schema for extracted XML data
const dataSchema = new mongoose.Schema({
  name: String,
  mobilePhone: String,
  pan: String,
  creditScore: Number,
  reportSummary: {
    totalAccounts: Number,
    activeAccounts: Number,
    closedAccounts: Number,
    currentBalanceAmount: Number,
    securedAccountsAmount: Number,
    unsecuredAccountsAmount: Number,
    last7DaysCreditEnquiries: Number,
  },
  creditAccountsInformation: [{
    creditCard: String,
    bank: String,
    address: String,
    accountNumber: String,
    amountOverdue: Number,
    currentBalance: Number,
  }],
});

const ExtractedData = mongoose.model('ExtractedData', dataSchema);

// Route for file upload and data extraction
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');

  // Read XML file and convert to JSON
  const parser = new xml2js.Parser();
  fs.readFile(req.file.path, (err, data) => {
    if (err) return res.status(500).send('Error reading file');

    parser.parseString(data, async (err, result) => {
      if (err) return res.status(500).send('Error parsing XML');

      // Extract the data from the parsed XML
      const extractedData = extractData(result);

      // Save the extracted data to MongoDB
      const newData = new ExtractedData(extractedData);
      await newData.save();
      res.status(200).json(extractedData); // Return extracted data in response
    });
  });
});

// Function to extract relevant data from XML
function extractData(xmlData) {
  const applicant = xmlData?.INProfileResponse?.Current_Application?.[0]?.Current_Application_Details?.[0]?.Current_Applicant_Details?.[0] || {};
  const scoreDetails = xmlData?.INProfileResponse?.SCORE?.[0] || {};
  const caisSummary = xmlData?.INProfileResponse?.CAIS_Account?.[0]?.CAIS_Summary?.[0]?.Credit_Account?.[0] || {};
  const outstandingBalance = xmlData?.INProfileResponse?.CAIS_Account?.[0]?.CAIS_Summary?.[0]?.Total_Outstanding_Balance?.[0] || {};
  const creditAccounts = xmlData?.INProfileResponse?.CAIS_Account?.[0]?.CAIS_Account_DETAILS || [];

  const extractedData = {
    name: `${applicant?.First_Name?.[0] || ''} ${applicant?.Middle_Name1?.[0] || ''} ${applicant?.Last_Name?.[0] || ''}`.trim(),
    mobilePhone: applicant?.MobilePhoneNumber?.[0] || '',
    pan: xmlData?.INProfileResponse?.CAIS_Account?.[0]?.CAIS_Holder_ID_Details?.[0]?.Income_TAX_PAN?.[0] || '',
    creditScore: parseInt(scoreDetails?.BureauScore?.[0] || 0),

    reportSummary: {
      totalAccounts: parseInt(caisSummary?.CreditAccountTotal?.[0] || 0),
      activeAccounts: parseInt(caisSummary?.CreditAccountActive?.[0] || 0),
      closedAccounts: parseInt(caisSummary?.CreditAccountClosed?.[0] || 0),
      currentBalanceAmount: parseFloat(outstandingBalance?.Outstanding_Balance_All?.[0] || 0),
      securedAccountsAmount: parseFloat(outstandingBalance?.Outstanding_Balance_Secured?.[0] || 0),
      unsecuredAccountsAmount: parseFloat(outstandingBalance?.Outstanding_Balance_UnSecured?.[0] || 0),
      last7DaysCreditEnquiries: parseInt(xmlData?.INProfileResponse?.TotalCAPS_Summary?.[0]?.TotalCAPSLast7Days?.[0] || 0),
    },

    creditAccountsInformation: creditAccounts.map((account) => ({
      creditCard: account?.Portfolio_Type?.[0] || '',
      bank: account?.Subscriber_Name?.[0]?.trim() || '',
      address: `${account?.CAIS_Holder_Address_Details?.[0]?.First_Line_Of_Address_non_normalized?.[0] || ''}, ${account?.CAIS_Holder_Address_Details?.[0]?.City_non_normalized?.[0] || ''}`.trim(),
      accountNumber: account?.Account_Number?.[0] || '',
      amountOverdue: parseFloat(account?.Amount_Past_Due?.[0] || 0),
      currentBalance: parseFloat(account?.Current_Balance?.[0] || 0),
    })),
  };

  return extractedData;
}

// Route to get all uploaded and extracted data
app.get('/data', async (req, res) => {
  try {
    const data = await ExtractedData.find();
    res.json(data);
  } catch (err) {
    res.status(500).send('Error retrieving data');
  }
});

