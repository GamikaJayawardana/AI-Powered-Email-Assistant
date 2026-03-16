import { Box, Button, CircularProgress, Container, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import axios from 'axios';
import { useState } from 'react'

function App() {
  const[emailContent,setEmailContent] = useState("");
  const [tone, setTone] = useState("");
  const [generatedReply, setGeneratedReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        "http://localhost:8080/api/email/generate",
        {emailContent, tone}
      );
      setGeneratedReply(typeof response.data === "string" ? response.data : JSON.stringify(response.data));
    } catch (error) {
      setError("Failed to generate reply. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" align="center" gutterBottom>
        Email Reply Generator
      </Typography>

      <Box sx={{ mx: 3 }}>
        <TextField
        fullWidth
        multiline
        rows={6}
        varient="outlined"
        label="Email Content"
        value={emailContent}
        onChange={(e) => setEmailContent(e.target.value)}
        sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Tone (Optional)</InputLabel>
          <Select
            value={tone}
            label="Tone (Optional)"
            onChange={(e) => setTone(e.target.value)}
          >
            <MenuItem value="">Default</MenuItem>
            <MenuItem value="formal">Formal</MenuItem>
            <MenuItem value="casual">Casual</MenuItem>
            <MenuItem value="friendly">Friendly</MenuItem>
            <MenuItem value="professional">Professional</MenuItem>
          </Select>

          <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={!emailContent || loading}
          sx={{ mt: 2 }}
          fullWidth
          >
            {loading ? <CircularProgress size={24} /> : "Generate Reply"}
          </Button>

        </FormControl>
      </Box>
      {error && (
        <Typography color="error" align="center" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      {generatedReply && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generated Reply:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            varient="outlined"
            value={generatedReply || ''}
            InputProps={{
              readOnly: true,
            }}
          /> 
          <Button
            variant="outlined"
            onClick={() => navigator.clipboard.writeText(generatedReply)}
            sx={{ mt: 2 }}
          >
            Copy to Clipboard
          </Button> 
        </Box>
      )}  

    </Container>
  )
}

export default App
