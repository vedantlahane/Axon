from django.conf import settings
from django.db import models


class Conversation(models.Model):
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="conversations",
		null=True,
		blank=True,
	)
	title = models.CharField(max_length=255, blank=True)
	summary = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-updated_at"]

	def __str__(self) -> str:  # pragma: no cover - debug helper
		return self.title or f"Conversation {self.pk}"


class Message(models.Model):
	ROLE_CHOICES = [
		("user", "User"),
		("assistant", "Assistant"),
	]

	conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
	role = models.CharField(max_length=20, choices=ROLE_CHOICES)
	content = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["created_at"]

	def __str__(self) -> str:  # pragma: no cover - debug helper
		return f"{self.role}: {self.content[:30]}"


class UploadedDocument(models.Model):
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="uploaded_documents",
		null=True,
		blank=True,
	)
	file = models.FileField(upload_to="uploaded_docs/")
	original_name = models.CharField(max_length=255)
	size = models.PositiveBigIntegerField(default=0)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self) -> str:  # pragma: no cover - debug helper
		return self.original_name


class UploadedDatabase(models.Model):
	"""Model for user-uploaded SQLite database files"""
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="uploaded_databases",
	)
	file = models.FileField(upload_to="uploaded_databases/")
	original_name = models.CharField(max_length=255)
	size = models.PositiveBigIntegerField(default=0)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self) -> str:  # pragma: no cover - debug helper
		return f"{self.original_name} ({self.user})"


class MessageAttachment(models.Model):
	message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="attachments")
	document = models.ForeignKey(UploadedDocument, on_delete=models.CASCADE, related_name="message_links")
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["created_at"]

	def __str__(self) -> str:  # pragma: no cover - debug helper
		document_pk = getattr(self.document, "pk", None)
		message_pk = getattr(self.message, "pk", None)
		return f"Attachment {document_pk} -> {message_pk}"


class DatabaseConnection(models.Model):
	MODE_SQLITE = "sqlite"
	MODE_URL = "url"
	MODE_CHOICES = [
		(MODE_SQLITE, "SQLite file"),
		(MODE_URL, "Connection URL"),
	]

	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="database_connection",
	)
	mode = models.CharField(max_length=20, choices=MODE_CHOICES)
	sqlite_path = models.CharField(max_length=512, blank=True)
	connection_url = models.TextField(blank=True)
	display_name = models.CharField(max_length=120, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-updated_at"]

	def __str__(self) -> str:  # pragma: no cover - debug helper
		mode_labels = dict(self.MODE_CHOICES)
		label = self.display_name or mode_labels.get(self.mode, "Database connection")
		return f"{label} ({self.mode})"


class PasswordResetToken(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="password_reset_tokens")
	token = models.CharField(max_length=255, unique=True)
	created_at = models.DateTimeField(auto_now_add=True)
	expires_at = models.DateTimeField()
	used = models.BooleanField(default=False)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self) -> str:  # pragma: no cover - debug helper
		status = "used" if self.used else "active"
		user_ref = getattr(self.user, "pk", None)
		return f"Reset token for {user_ref} ({status})"


class MessageFeedback(models.Model):
	"""Store user feedback (like/dislike/report) on assistant messages."""
	FEEDBACK_LIKE = "like"
	FEEDBACK_DISLIKE = "dislike"
	FEEDBACK_REPORT = "report"
	FEEDBACK_CHOICES = [
		(FEEDBACK_LIKE, "Like"),
		(FEEDBACK_DISLIKE, "Dislike"),
		(FEEDBACK_REPORT, "Report"),
	]

	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="message_feedbacks",
	)
	message = models.ForeignKey(
		Message,
		on_delete=models.CASCADE,
		related_name="feedbacks",
	)
	feedback_type = models.CharField(max_length=20, choices=FEEDBACK_CHOICES)
	report_reason = models.TextField(blank=True)  # Optional reason for reports
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-created_at"]
		unique_together = [["user", "message"]]  # One feedback per user per message

	def __str__(self) -> str:
		return f"{self.feedback_type} on message {self.message_id} by user {self.user_id}"


class UserPreferences(models.Model):
	"""Store user preferences including preferred AI model."""
	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="preferences",
	)
	preferred_model = models.CharField(max_length=50, default="gemini")
	theme = models.CharField(max_length=20, default="dark")
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		verbose_name_plural = "User preferences"

	def __str__(self) -> str:
		return f"Preferences for user {self.user_id}"
