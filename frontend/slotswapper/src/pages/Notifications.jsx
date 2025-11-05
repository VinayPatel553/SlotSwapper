import { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import api from '../utils/api';

const Notifications = () => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    try {
      const [incomingRes, outgoingRes] = await Promise.all([
        api.get('/swap-requests/incoming'),
        api.get('/swap-requests/outgoing')
      ]);
      setIncomingRequests(incomingRes.data);
      setOutgoingRequests(outgoingRes.data);
    } catch (err) {
      setError('Failed to fetch swap requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapResponse = async (requestId, accepted) => {
    setError('');
    setSuccess('');

    try {
      await api.post(`/swap-response/${requestId}`, { accepted });
      setSuccess(accepted ? 'Swap accepted successfully!' : 'Swap rejected');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond to swap request');
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'warning',
      ACCEPTED: 'success',
      REJECTED: 'danger'
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Swap Requests</h2>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Tabs defaultActiveKey="incoming" className="mb-4">
        <Tab eventKey="incoming" title={`Incoming Requests (${incomingRequests.length})`}>
          <Card>
            <Card.Body>
              {incomingRequests.length === 0 ? (
                <p className="text-center text-muted">No incoming swap requests.</p>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>Their Slot</th>
                      <th>Your Slot</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomingRequests.map((request) => (
                      <tr key={request._id}>
                        <td>{request.requesterId?.name || 'Unknown'}</td>
                        <td>
                          <strong>{request.requesterSlotId?.title}</strong>
                          <br />
                          <small className="text-muted">
                            {formatDateTime(request.requesterSlotId?.startTime)} - {formatDateTime(request.requesterSlotId?.endTime)}
                          </small>
                        </td>
                        <td>
                          <strong>{request.responderSlotId?.title}</strong>
                          <br />
                          <small className="text-muted">
                            {formatDateTime(request.responderSlotId?.startTime)} - {formatDateTime(request.responderSlotId?.endTime)}
                          </small>
                        </td>
                        <td>{getStatusBadge(request.status)}</td>
                        <td>
                          {request.status === 'PENDING' && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                className="me-2"
                                onClick={() => handleSwapResponse(request._id, true)}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleSwapResponse(request._id, false)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {request.status !== 'PENDING' && (
                            <span className="text-muted">No action available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="outgoing" title={`Outgoing Requests (${outgoingRequests.length})`}>
          <Card>
            <Card.Body>
              {outgoingRequests.length === 0 ? (
                <p className="text-center text-muted">No outgoing swap requests.</p>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>To</th>
                      <th>Your Slot</th>
                      <th>Their Slot</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outgoingRequests.map((request) => (
                      <tr key={request._id}>
                        <td>{request.responderId?.name || 'Unknown'}</td>
                        <td>
                          <strong>{request.requesterSlotId?.title}</strong>
                          <br />
                          <small className="text-muted">
                            {formatDateTime(request.requesterSlotId?.startTime)} - {formatDateTime(request.requesterSlotId?.endTime)}
                          </small>
                        </td>
                        <td>
                          <strong>{request.responderSlotId?.title}</strong>
                          <br />
                          <small className="text-muted">
                            {formatDateTime(request.responderSlotId?.startTime)} - {formatDateTime(request.responderSlotId?.endTime)}
                          </small>
                        </td>
                        <td>{getStatusBadge(request.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default Notifications;

