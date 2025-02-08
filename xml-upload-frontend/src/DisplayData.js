import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './style.css';

const DisplayData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get('http://localhost:5000/data')
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError('Error fetching data');
        setLoading(false);
        console.error('Error fetching data:', error);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Uploaded Data</h2>

      {/* Table for Basic Details and Report Summary */}
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile Phone</th>
            <th>PAN</th>
            <th>Credit Score</th>
            <th>Total Accounts</th>
            <th>Active Accounts</th>
            <th>Closed Accounts</th>
            <th>Current Balance Amount</th>
            <th>Secured Accounts Amount</th>
            <th>Unsecured Accounts Amount</th>
            <th>Last 7 Days Credit Enquiries</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.mobilePhone}</td>
              <td>{item.pan || 'N/A'}</td>
              <td>{item.creditScore}</td>
              <td>{item.reportSummary?.totalAccounts}</td>
              <td>{item.reportSummary?.activeAccounts}</td>
              <td>{item.reportSummary?.closedAccounts}</td>
              <td>{item.reportSummary?.currentBalanceAmount}</td>
              <td>{item.reportSummary?.securedAccountsAmount}</td>
              <td>{item.reportSummary?.unsecuredAccountsAmount}</td>
              <td>{item.reportSummary?.last7DaysCreditEnquiries}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Table for Credit Accounts Information */}
      <h3>Credit Accounts Information</h3>
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Credit Card Type</th>
            <th>Bank</th>
            <th>Address</th>
            <th>Account Number</th>
            <th>Amount Overdue</th>
            <th>Current Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) =>
            item.creditAccountsInformation?.map((account, accIndex) => (
              <tr key={`${index}-${accIndex}`}>
                <td>{item.name}</td> {/* Added user name in Credit Accounts Table */}
                <td>{account.creditCard}</td>
                <td>{account.bank}</td>
                <td>{account.address}</td>
                <td>{account.accountNumber}</td>
                <td>{account.amountOverdue}</td>
                <td>{account.currentBalance}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DisplayData;
