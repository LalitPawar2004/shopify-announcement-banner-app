import { useState, useEffect, useCallback } from "react"
import {
    Page,
    Layout,
    Card,
    FormLayout,
    TextField,
    Button,
    Banner,
    Text,
} from "@shopify/polaris"

export default function AnnouncementPage() {
    const [text, setText] = useState("")
    const [saving, setSaving] = useState(false)
    const [banner, setBanner] = useState(null)
    const [currentAnnouncement, setCurrentAnnouncement] = useState(null)
    const [loadingAnnouncement, setLoadingAnnouncement] = useState(true)

    useEffect(() => {
        async function fetchAnnouncement() {
            try {
                const response = await fetch("/api/announcement")
                if (!response.ok) {
                    return
                }
                const data = await response.json()
                setCurrentAnnouncement(data.announcement?.text || null)
            } catch (error) {
                console.error("Failed to load current announcement", error)
            } finally {
                setLoadingAnnouncement(false)
            }
        }

        fetchAnnouncement()
    }, [])

    const handleSave = useCallback(async () => {
        setSaving(true)
        setBanner(null)

        try {
            const response = await fetch("/api/announcement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            })
            const data = await response.json()

            if (response.ok) {
                setBanner({ type: "success", message: "Announcement saved and synced to storefront!" })
                setCurrentAnnouncement(data.announcement.text)
                setText("")
            } else {
                setBanner({ type: "critical", message: data.error || "Something went wrong" })
            }
        } catch (error) {
            setBanner({ type: "critical", message: "Network error. Please try again." })
        } finally {
            setSaving(false)
        }
    }, [text])

    const bannerMarkup = banner ? (
        <Banner title={banner.message} tone={banner.type} onDismiss={() => setBanner(null)} />
    ) : null

    return (
        <Page title="Announcement Banner" subtitle="Set a global announcement for your storefront">
            <Layout>
                <Layout.Section>
                    {bannerMarkup}
                    <Card sectioned>
                        <Text as="h3" variant="headingMd">
                            Current announcement
                        </Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                            {loadingAnnouncement ? "Loading announcement..." : currentAnnouncement || "No announcement has been saved yet."}
                        </Text>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <FormLayout>
                            <TextField
                                label="Announcement Text"
                                value={text}
                                onChange={setText}
                                placeholder="e.g. Free shipping on all orders!"
                                autoComplete="off"
                                multiline={2}
                                helpText="This text will appear as a banner on every page of your store."
                            />
                            <Button variant="primary" onClick={handleSave} loading={saving} disabled={text.trim() === ""}>
                                Save Announcement
                            </Button>
                        </FormLayout>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Card sectioned>
                        <Text as="h3" variant="headingMd">
                            How it works
                        </Text>
                        <div style={{ marginTop: "8px" }}>
                            <Text as="p" variant="bodyMd" tone="subdued">
                                1. Type your announcement and click Save.
                            </Text>
                            <Text as="p" variant="bodyMd" tone="subdued">
                                2. The announcement is stored in MongoDB and synced to Shopify using a metafield.
                            </Text>
                            <Text as="p" variant="bodyMd" tone="subdued">
                                3. The theme app extension displays the metafield value on every storefront page.
                            </Text>
                        </div>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
}
