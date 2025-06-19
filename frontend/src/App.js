import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import './App.css'
import {
  extractUnusedPackages,
  countDependencies,
  countVulnerabilities,
} from './utils'
import {
  Button,
  Container,
  Spinner,
  Alert,
  Tabs,
  Tab,
  Card,
  Badge,
  ListGroup,
  Modal,
  Form,
} from 'react-bootstrap'

const App = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadLoading, setIsUploadLoading] = useState(false)
  const [logs, setLogs] = useState(null)
  const [reports, setReports] = useState({})
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [packageToUninstall, setPackageToUninstall] = useState('')
  const [uninstallMessage, setUninstallMessage] = useState('')
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)

  // Fetch available projects on initial mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects')
        setProjects(response.data)
      } catch (err) {
        console.error("Couldn't fetch projects", err)
        setError('Impossible de charger la liste des projets.')
      }
    }
    fetchProjects()
  }, [])

  // Fetch reports when a project is selected
  useEffect(() => {
    const fetchReports = async () => {
      if (!selectedProject) return
      setIsLoading(true)
      try {
        const response = await axios.get(
          `/api/projects/${selectedProject}/reports`
        )
        setReports(response.data)
      } catch (err) {
        console.error("Couldn't fetch reports", err)
        // Ne pas afficher d'erreur si les rapports n'existent pas encore
      }
      setIsLoading(false)
    }

    fetchReports()
  }, [selectedProject])

  const handleAudit = async () => {
    if (!selectedProject) {
      setError('Veuillez sélectionner un projet à auditer.')
      return
    }

    setIsLoading(true)
    setError(null)
    setLogs(null)
    try {
      // La nouvelle route d'audit est un POST
      const response = await axios.post(
        `/api/projects/${selectedProject}/audit`
      )
      setLogs(response.data.logs)
      // Re-fetch reports after audit
      const reportsResponse = await axios.get(
        `/api/projects/${selectedProject}/reports`
      )
      setReports(reportsResponse.data)
    } catch (err) {
      setError("Une erreur est survenue lors de l'audit.")
      console.error(err)
    }
    setIsLoading(false)
  }

  const handleUninstall = async (packageName) => {
    if (!packageName.trim()) {
      setUninstallMessage('Veuillez entrer un nom de package à désinstaller')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      // La nouvelle route de désinstallation est un POST
      const response = await axios.post(
        `/api/projects/${selectedProject}/uninstall/${packageName}`
      )
      setUninstallMessage(response.data)
      setPackageToUninstall('')
      // Refresh audit and reports after uninstalling
      await handleAudit()
    } catch (err) {
      setError(`Erreur lors de la désinstallation de ${packageName}`)
      console.error(err)
    }
    setIsLoading(false)
  }

  const handleProjectSelect = (projectId) => {
    if (projectId) {
      setSelectedProject(projectId)
      // Reset reports and logs
      setReports({})
      setLogs(null)
    } else {
      setSelectedProject(null)
    }
  }

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0])
    setIsUploadLoading(false)
  }

  const handleFileUpload = async () => {
    if (!uploadFile) {
      setError('Veuillez sélectionner un fichier à télécharger.')
      return
    }

    setIsUploadLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('projectFile', uploadFile)

      const response = await axios.post('/api/projects/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        // Re-fetch project list after upload
        const projectsResponse = await axios.get('/api/projects')
        setProjects(projectsResponse.data)
        // Select the new project
        setSelectedProject(response.data.project.id)
        setShowUploadModal(false)
        setUploadFile(null)
      }
    } catch (err) {
      setError('Erreur lors du téléchargement du projet.')
      console.error(err)
    }
    setIsUploadLoading(false)
  }

  // useMemo pour optimiser les calculs dérivés de l'état 'reports'
  const unusedPackages = useMemo(() => {
    if (!reports.unused) return []
    try {
      return extractUnusedPackages(JSON.parse(reports.unused))
    } catch (e) {
      console.error('Error parsing unused packages report:', e)
      return []
    }
  }, [reports.unused])

  const dependencies = useMemo(
    () => countDependencies(reports.installed),
    [reports.installed]
  )

  const vulnerabilities = useMemo(() => {
    if (!reports.security) return { low: 0, moderate: 0, high: 0, critical: 0 }
    try {
      // The audit report from the server can be a stringified JSON or just a string error message
      const securityData = JSON.parse(reports.security)
      return countVulnerabilities(securityData)
    } catch (e) {
      console.error('Error parsing security report:', e)
      return { low: 0, moderate: 0, high: 0, critical: 0 }
    }
  }, [reports.security])

  // Upload Project Modal
  const renderUploadModal = () => (
    <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Importer un nouveau projet</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Fichier du projet (ZIP ou RAR)</Form.Label>
            <Form.Control
              type="file"
              accept=".zip,.rar"
              onChange={handleFileChange}
            />
            <Form.Text className="text-muted">
              Sélectionnez un fichier ZIP ou RAR contenant un projet Node.js/npm
              avec un package.json.
            </Form.Text>
          </Form.Group>
        </Form>
        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleFileUpload}
          disabled={isUploadLoading || !uploadFile}
        >
          {isUploadLoading ? (
            <>
              <Spinner animation="border" size="sm" /> Import...
            </>
          ) : (
            'Importer'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )

  return (
    <Container className="mt-4">
      <h1 className="mb-4">🚀 NPM Clean Audit</h1>

      {/* Project Selection */}
      <Card className="mb-4">
        <Card.Header>Sélection du projet</Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Select
              value={selectedProject || ''}
              onChange={(e) => handleProjectSelect(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Sélectionnez un projet</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Form.Select>
            <Button
              variant="outline-primary"
              onClick={() => setShowUploadModal(true)}
              className="ms-3"
            >
              Importer un projet
            </Button>
          </div>

          {selectedProject && (
            <Alert variant="info">
              Projet sélectionné:{' '}
              <strong>
                {projects.find((p) => p.id === selectedProject)?.name ||
                  selectedProject}
              </strong>
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
        <Tab eventKey="dashboard" title="Dashboard">
          <div className="d-flex justify-content-start mb-4">
            <Button
              variant="primary"
              onClick={handleAudit}
              disabled={isLoading || !selectedProject}
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" /> Audit en cours...
                </>
              ) : (
                "🔍 Lancer l'audit"
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {uninstallMessage && (
            <Alert
              variant="info"
              className="mb-3"
              onClose={() => setUninstallMessage('')}
              dismissible
            >
              {uninstallMessage}
            </Alert>
          )}

          <div className="row mb-4">
            <div className="col-md-4 mb-3">
              <Card>
                <Card.Body>
                  <Card.Title>Dépendances</Card.Title>
                  <h2>{dependencies}</h2>
                  <Card.Text>Packages installés</Card.Text>
                </Card.Body>
              </Card>
            </div>

            <div className="col-md-4 mb-3">
              <Card>
                <Card.Body>
                  <Card.Title>Inutilisés</Card.Title>
                  <h2>{unusedPackages.length}</h2>
                  <Card.Text>Packages non utilisés</Card.Text>
                </Card.Body>
              </Card>
            </div>

            <div className="col-md-4 mb-3">
              <Card>
                <Card.Body>
                  <Card.Title>Vulnérabilités</Card.Title>
                  <h2>
                    {vulnerabilities.low +
                      vulnerabilities.moderate +
                      vulnerabilities.high +
                      vulnerabilities.critical}
                  </h2>
                  <div>
                    {vulnerabilities.critical > 0 && (
                      <Badge bg="danger" className="me-1">
                        Critique: {vulnerabilities.critical}
                      </Badge>
                    )}
                    {vulnerabilities.high > 0 && (
                      <Badge bg="warning" text="dark" className="me-1">
                        Haute: {vulnerabilities.high}
                      </Badge>
                    )}
                    {vulnerabilities.moderate > 0 && (
                      <Badge bg="info" className="me-1">
                        Modérée: {vulnerabilities.moderate}
                      </Badge>
                    )}
                    {vulnerabilities.low > 0 && (
                      <Badge bg="secondary">Basse: {vulnerabilities.low}</Badge>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>

          {unusedPackages.length > 0 && (
            <Card className="mb-4">
              <Card.Header>Packages non utilisés</Card.Header>
              <ListGroup variant="flush">
                {unusedPackages.map((pkg) => (
                  <ListGroup.Item
                    key={pkg}
                    className="d-flex justify-content-between align-items-center"
                  >
                    {pkg}
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleUninstall(pkg)}
                      disabled={isLoading}
                    >
                      Désinstaller
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          )}

          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nom du package à désinstaller"
              value={packageToUninstall}
              onChange={(e) => setPackageToUninstall(e.target.value)}
              disabled={!selectedProject}
            />
            <Button
              variant="outline-danger"
              onClick={() => handleUninstall(packageToUninstall)}
              disabled={
                isLoading || !selectedProject || !packageToUninstall.trim()
              }
            >
              Désinstaller
            </Button>
          </div>
        </Tab>

        <Tab eventKey="logs" title="Logs">
          <pre
            className="border p-3 bg-light"
            style={{ maxHeight: '500px', overflow: 'auto' }}
          >
            {logs
              ? JSON.stringify(logs, null, 2)
              : 'Lancez un audit pour voir les logs ici'}
          </pre>
        </Tab>

        <Tab eventKey="installed" title="Packages Installés">
          <pre
            className="border p-3 bg-light"
            style={{ maxHeight: '500px', overflow: 'auto' }}
          >
            {reports.installed || 'Aucun rapport disponible'}
          </pre>
        </Tab>

        <Tab eventKey="unused" title="Packages Inutilisés">
          <pre
            className="border p-3 bg-light"
            style={{ maxHeight: '500px', overflow: 'auto' }}
          >
            {reports.unused || 'Aucun rapport disponible'}
          </pre>
        </Tab>

        <Tab eventKey="security" title="Audit Sécurité">
          <pre
            className="border p-3 bg-light"
            style={{ maxHeight: '500px', overflow: 'auto' }}
          >
            {reports.security || 'Aucun rapport disponible'}
          </pre>
        </Tab>

        {reports.gitDiff && (
          <Tab eventKey="gitdiff" title="Git Diff">
            <pre
              className="border p-3 bg-light"
              style={{ maxHeight: '500px', overflow: 'auto' }}
            >
              {reports.gitDiff}
            </pre>
          </Tab>
        )}
      </Tabs>

      {renderUploadModal()}
    </Container>
  )
}

export default App
