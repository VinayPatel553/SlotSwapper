import { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Modal, Alert, Badge } from 'react-bootstrap';
import api from '../utils/api';

const Marketplace = () => {
  const [swappableSlots, setSwappableSlots] = useState([]);
  const [mySwappableSlots, setMySwappableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSwappableSlots();
    fetchMySwappableSlots();
  }, []);

  const fetchSwappableSlots = async () => {
    try {
      const response = await api.get('/swappable-slots');
      setSwappableSlots(response.data);
    } catch (err) {
      setError('Failed to fetch swappable slots');
    } finally {
      setLoading(false);
    }
  };

  const fetchMySwappableSlots = async () => {
    try {
      const response = await api.get('/events');
      const swappable = response.data.filter(event => event.status === 'SWAPPABLE');
      setMySwappableSlots(swappable);
    } catch (err) {
      console.error('Failed to fetch my swappable slots');
    }
  };

  const handleRequestSwap = (slot) => {
    if (mySwappableSlots.length === 0) {
      setError('You need to have at least one swappable slot to request a swap');
      return;
    }
    setSelectedSlot(slot);
    setShowModal(true);
  };

  const handleConfirmSwap = async (mySlotId) => {
    setError('');
    setSuccess('');
    
    try {
      await api.post('/swap-request', {
        mySlotId,
        theirSlotId: selectedSlot._id
      });
      setSuccess('Swap request sent successfully!');
      setShowModal(false);
      fetchSwappableSlots();
      fetchMySwappableSlots();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send swap request');
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
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
      <h2 className="mb-4">Marketplace - Available Slots</h2>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Card>
        <Card.Body>
          {swappableSlots.length === 0 ? (
            <p className="text-center text-muted">No swappable slots available at the moment.</p>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Owner</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {swappableSlots.map((slot) => (
                  <tr key={slot._id}>
                    <td>{slot.title}</td>
                    <td>{slot.userId?.name || 'Unknown'}</td>
                    <td>{formatDateTime(slot.startTime)}</td>
                    <td>{formatDateTime(slot.endTime)}</td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRequestSwap(slot)}
                      >
                        Request Swap
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Swap Request Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Request Swap</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSlot && (
            <>
              <p><strong>Requesting swap for:</strong></p>
              <p>{selectedSlot.title} - {formatDateTime(selectedSlot.startTime)} to {formatDateTime(selectedSlot.endTime)}</p>
              <p className="text-muted">Owner: {selectedSlot.userId?.name}</p>
              <hr />
              <p><strong>Select your slot to offer:</strong></p>
              {mySwappableSlots.length === 0 ? (
                <Alert variant="warning">
                  You don't have any swappable slots. Go to Dashboard and mark a slot as swappable first.
                </Alert>
              ) : (
                <div className="list-group">
                  {mySwappableSlots.map((slot) => (
                    <button
                      key={slot._id}
                      className="list-group-item list-group-item-action"
                      onClick={() => handleConfirmSwap(slot._id)}
                    >
                      <div>
                        <strong>{slot.title}</strong>
                        <br />
                        <small className="text-muted">
                          {formatDateTime(slot.startTime)} - {formatDateTime(slot.endTime)}
                        </small>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Marketplace;

