$file = 'projects/homey/frontend/static/index.html'
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$base64 = [Convert]::ToBase64String($bytes)
$base64 | ssh REDACTED_USERNAME@REDACTED_SERVER_IP "PATH=/usr/local/bin:/usr/bin:/bin:/usr/syno/bin && cd /var/services/homes/REDACTED_USERNAME/projects/homey && base64 -d > frontend/static/index.html"

