import React, { useState, useEffect, useRef } from 'react';


// Import the CSS file
import './chart.css'; // Assuming chart.css is in the same directory

function App() {
    const [activeTab, setActiveTab] = useState('campaign-analytics');

    const [openedEmails, setOpenedEmails] = useState([]);
    const [clickedEmails, setClickedEmails] = useState([]);
    const [receivedEmails, setReceivedEmails] = useState([]); // This will also represent "total mails sent"
    const [repliedEmails, setRepliedEmails] = useState([]);
    const [bouncedEmails, setBouncedEmails] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });

    // State for the dynamically displayed table
    const [displayedDetails, setDisplayedDetails] = useState([]);
    const [displayedDetailsTitle, setDisplayedDetailsTitle] = useState('');

    // States for campaign selection and search
    const [campaigns, setCampaigns] = useState([]);
    const [filteredCampaigns, setFilteredCampaigns] = useState([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [selectedCampaignName, setSelectedCampaignName] = useState('Select a Campaign');
    const [searchQuery, setSearchQuery] = useState('');

    // New states for KPIs and Chart Data
    const [allCampaignKpis, setAllCampaignKpis] = useState({});
    const [currentCampaignKpis, setCurrentCampaignKpis] = useState({});
    const [engagementChartData, setEngagementChartData] = useState([]);
    const [rawInteractions, setRawInteractions] = useState([]); // New state to store all raw interactions for the current view

    // State for chart hover details
    const [hoveredPoint, setHoveredPoint] = useState(null); // { date, opened, clicked, replied, x, y }

    // Function to show messages in the message box
    const showMessage = (text, type = 'info') => {
        setMessage({ text, type });
        setTimeout(() => {
            setMessage({ text: '', type: '' });
        }, 3000); // Hide after 3 seconds
    };

    // Fetch list of campaigns
    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/campaigns');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const campaignsData = await response.json();

                const fetchedCampaigns = [];
                let allInteractions = []; // To aggregate interactions for all campaigns
                let bestSubjectLine = { subject: 'N/A', openRate: 0 };

                campaignsData.forEach(data => {
                    fetchedCampaigns.push({ id: data.id, name: data.campaignName, subjectLine: data.subjectLine || 'N/A' });
                    if (data.interactions && Array.isArray(data.interactions)) {
                        allInteractions = allInteractions.concat(data.interactions);

                        // Basic best subject line calculation (can be improved)
                        const campaignReceived = data.interactions.filter(int => int.type === 'received').length;
                        const campaignOpened = data.interactions.filter(int => int.type === 'opened').length;
                        if (campaignReceived > 0) {
                            const rate = (campaignOpened / campaignReceived) * 100;
                        if (rate > bestSubjectLine.openRate) {
                            bestSubjectLine = { subject: data.subjectLine, openRate: rate };
                        }
                    }
                }
            });
            setCampaigns(fetchedCampaigns);
            setRawInteractions(allInteractions); // Store all raw interactions

            // Calculate KPIs for all campaigns
            const totalReceived = allInteractions.filter(int => int.type === 'received').length;
            const totalOpened = allInteractions.filter(int => int.type === 'opened').length;
            const totalClicked = allInteractions.filter(int => int.type === 'clicked').length;
            const totalReplied = allInteractions.filter(int => int.type === 'replied').length;
            const totalBounced = allInteractions.filter(int => int.type === 'bounced').length;

            setAllCampaignKpis({
                totalSent: totalReceived,
                openRate: totalReceived > 0 ? ((totalOpened / totalReceived) * 100).toFixed(2) : '0.00',
                ctr: totalReceived > 0 ? ((totalClicked / totalReceived) * 100).toFixed(2) : '0.00',
                replyRate: totalReceived > 0 ? ((totalReplied / totalReceived) * 100).toFixed(2) : '0.00',
                bounceRate: totalReceived > 0 ? ((totalBounced / totalReceived) * 100).toFixed(2) : '0.00',
                bestPerformingSubjectLine: bestSubjectLine.subject,
            });

            // If no campaign is selected and campaigns are available, select the first one
            if (!selectedCampaignId && fetchedCampaigns.length > 0) {
                setSelectedCampaignId(fetchedCampaigns[0].id);
                setSelectedCampaignName(fetchedCampaigns[0].name);
            } else if (selectedCampaignId && !fetchedCampaigns.find(c => c.id === selectedCampaignId)) {
                // If previously selected campaign is no longer available, reset
                setSelectedCampaignId('');
                setSelectedCampaignName('Select a Campaign');
                setOpenedEmails([]);
                setClickedEmails([]);
                setReceivedEmails([]);
                setRepliedEmails([]);
                setBouncedEmails([]);
                setDisplayedDetails([]);
                setDisplayedDetailsTitle('');
                setCurrentCampaignKpis({}); // Reset current campaign KPIs
                setEngagementChartData([]); // Reset chart data
            }
        }, (error) => {
            console.error("Error fetching campaigns list:", error);
            showMessage(`Error fetching campaigns list: ${error.message}`, "error");
        });

    }, []);

    // Filter campaigns based on search query
    useEffect(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filtered = campaigns.filter(campaign =>
            campaign.name.toLowerCase().includes(lowerCaseQuery)
        );
        setFilteredCampaigns(filtered);
    }, [searchQuery, campaigns]);


    // Setup Firestore listener for the selected campaign's data and calculate KPIs/Chart Data
    useEffect(() => {
        if (selectedCampaignId) {
            const fetchCampaignData = async () => {
                try {
                    const response = await fetch(`http://localhost:5000/api/campaigns/${selectedCampaignId}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const campaign = await response.json();
                    
                    let opened = [];
                    let clicked = [];
                    let received = [];
                    let replied = [];
                    let bounced = [];
                    let currentCampaignRawInteractions = [];

                    if (campaign.interactions && Array.isArray(campaign.interactions)) {
                        campaign.interactions.forEach(interaction => {
                            const emailData = {
                                email: interaction.email || 'N/A',
                                firstName: interaction.firstName || 'N/A',
                                lastName: interaction.lastName || 'N/A',
                                timestamp: interaction.timestamp ? new Date(interaction.timestamp).toLocaleString() : 'N/A',
                                type: interaction.type // Include type for daily details
                            };
                            currentCampaignRawInteractions.push(interaction);

                            if (interaction.type === 'opened') opened.push(emailData);
                            if (interaction.type === 'clicked') clicked.push(emailData);
                            if (interaction.type === 'replied') replied.push(emailData);
                            if (interaction.type === 'bounced') bounced.push(emailData);
                        });
                    }

                    setOpenedEmails(opened);
                    setClickedEmails(clicked);
                    setReceivedEmails(received);
                    setRepliedEmails(replied);
                    setBouncedEmails(bounced);
                    setRawInteractions(currentCampaignRawInteractions);

                    // Calculate KPIs for the selected campaign
                    const totalReceived = received.length;
                    const totalOpened = opened.length;
                    const totalClicked = clicked.length;
                    const totalReplied = replied.length;
                    const totalBounced = bounced.length;

                    setCurrentCampaignKpis({
                        totalSent: totalReceived,
                        openRate: totalReceived > 0 ? ((totalOpened / totalReceived) * 100).toFixed(2) : '0.00',
                        ctr: totalReceived > 0 ? ((totalClicked / totalReceived) * 100).toFixed(2) : '0.00',
                        replyRate: totalReceived > 0 ? ((totalReplied / totalReceived) * 100).toFixed(2) : '0.00',
                        bounceRate: totalReceived > 0 ? ((totalBounced / totalReceived) * 100).toFixed(2) : '0.00',
                        bestPerformingSubjectLine: campaign.subjectLine || 'N/A',
                    });

                    // Aggregate data for the Time Series Line Chart
                    const dailyData = currentCampaignRawInteractions.reduce((acc, interaction) => {
                        const date = new Date(interaction.timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD
                        if (!acc[date]) {
                            acc[date] = { date, opened: 0, clicked: 0, replied: 0 };
                        }
                        if (interaction.type === 'opened') acc[date].opened++;
                        if (interaction.type === 'clicked') acc[date].clicked++;
                        if (interaction.type === 'replied') acc[date].replied++;
                        return acc;
                    }, {});

                    const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b));
                    const chartData = sortedDates.map(date => dailyData[date]);
                    setEngagementChartData(chartData);

                } catch (error) {
                    console.error("Error fetching campaign data:", error);
                    showMessage(`Error fetching campaign data: ${error.message}`, "error");
                }
            };
            fetchCampaignData();
        }
    }, [selectedCampaignId, rawInteractions]);
                        }
                        if (interaction.type === 'opened') acc[date].opened++;
                        if (interaction.type === 'clicked') acc[date].clicked++;
                        if (interaction.type === 'replied') acc[date].replied++;
                        return acc;
                    }, {});

                    const sortedChartData = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
                    setEngagementChartData(sortedChartData);


                    // If no specific details are displayed, default to 'Who Opened' for the new campaign
                    if (displayedDetailsTitle === 'Who Opened' || displayedDetails.length === 0) {
                        setDisplayedDetails(opened);
                        setDisplayedDetailsTitle('Who Opened');
                    } else if (displayedDetailsTitle === 'Who Clicked') {
                        setDisplayedDetails(clicked);
                    } else if (displayedDetailsTitle === 'Who Received' || displayedDetailsTitle === 'Total Mails Sent') {
                        setDisplayedDetails(received);
                    } else if (displayedDetailsTitle === 'Who Replied') {
                        setDisplayedDetails(replied);
                    } else if (displayedDetailsTitle === 'Which Bounced') {
                        setDisplayedDetails(bounced);
                    }

                } else {
                    console.log(`Campaign ${selectedCampaignId} does not exist.`);
                    setOpenedEmails([]);
                    setClickedEmails([]);
                    setReceivedEmails([]);
                    setRepliedEmails([]);
                    setBouncedEmails([]);
                    setDisplayedDetails([]);
                    setDisplayedDetailsTitle('');
                    setCurrentCampaignKpis({}); // Reset current campaign KPIs
                    setEngagementChartData([]); // Reset chart data
                    setRawInteractions([]); // Reset raw interactions
                }
            }, (error) => {
                console.error(`Error listening to campaign ${selectedCampaignId}:`, error);
                showMessage(`Error fetching campaign data: ${error.message}`, "error");
            });
        } else {
            // When "All Campaigns" is selected, rawInteractions should already be populated from the campaigns list effect
            // Re-aggregate chart data for all campaigns
            const dailyData = rawInteractions.reduce((acc, interaction) => {
                const date = new Date(interaction.timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD
                if (!acc[date]) {
                    acc[date] = { date, opened: 0, clicked: 0, replied: 0 };
                }
                if (interaction.type === 'opened') acc[date].opened++;
                if (interaction.type === 'clicked') acc[date].clicked++;
                if (interaction.type === 'replied') acc[date].replied++;
                return acc;
            }, {});
            const sortedChartData = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
            setEngagementChartData(sortedChartData);
        }


        return () => unsubscribe && unsubscribe();
    }, [dbRef.current, selectedCampaignId, displayedDetailsTitle, rawInteractions]); // Added rawInteractions to dependency array

    // Helper to render the details table
    const renderDetailsTable = (details, title) => {
        if (details.length === 0) {
            return <p className="text-gray-400 italic">No data to display for {title}.</p>;
        }

        // Determine if the title should be purple
        const isPurpleTitle = ['Who Opened', 'Who Clicked', 'Who Received', 'Which Bounced', 'Total Mails Sent', 'Who Replied'].includes(title);
        const titleColorClass = isPurpleTitle ? 'purple-text' : 'white-text';

        return (
            <div className="details-table-container custom-scrollbar">
                <h3 className={`details-table-title ${titleColorClass}`}>{title} Details</h3>
                <table className="details-table">
                    <thead><tr>
                        <th scope="col">First Name</th>
                        <th scope="col">Last Name</th>
                        <th scope="col">Email</th>
                        <th scope="col">Type</th> {/* Added Type column */}
                        <th scope="col">Timestamp</th>
                    </tr></thead>
                    <tbody>
                        {details.map((data, index) => (
                            <tr key={index}>
                                <td>{data.firstName}</td>
                                <td>{data.lastName}</td>
                                <td>{data.email}</td>
                                <td>{data.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) : 'N/A'}</td> {/* Display type */}
                                <td>{data.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="download-button-container">
                    <button
                        onClick={() => downloadCSV(details, title.replace(/\s/g, '_').toLowerCase())}
                        className="download-button"
                    >
                        Download Current Data CSV
                    </button>
                </div>
            </div>
        );
    };

    const getMessageBoxClasses = () => {
        let classes = "message-box";
        if (message.text === '') {
            classes += ' hidden';
        } else if (message.type === 'error') {
            classes += ' error-message';
        } else if (message.type === 'success') {
            classes += ' success-message';
        } else {
            classes += ' info-message';
        }
        return classes;
    };

    // Function to download data as CSV
    const downloadCSV = (data, filename) => {
        if (data.length === 0) {
            showMessage('No data to download.', 'info');
            return;
        }

        // Define CSV headers
        const headers = ["First Name", "Last Name", "Email", "Type", "Timestamp"]; // Added Type header

        // Map data to CSV rows
        const csvRows = data.map(row =>
            [row.firstName, row.lastName, row.email, row.type, row.timestamp].map(field => // Added row.type
                `"${String(field).replace(/"/g, '""')}"` // Escape double quotes and wrap in quotes
            ).join(',')
        );

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(',') + "\n"
            + csvRows.join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link); // Clean up
        showMessage(`Downloading ${filename}.csv`, 'success');
    };

    const kpisToDisplay = selectedCampaignId ? currentCampaignKpis : allCampaignKpis;

    // Function to handle chart clicks
    const handleChartClick = (event) => {
        const svg = event.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = event.clientX - rect.left; // X-coordinate relative to SVG

        const width = 600; // Must match SVG width
        const height = 300; // Must match SVG height
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const innerWidth = width - margin.left - margin.right;

        if (engagementChartData.length === 0) return;

        // Calculate the approximate date based on the click's X position
        const dates = engagementChartData.map(d => new Date(d.date));
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);

        // Reverse scale to get approximate date from x-coordinate
        const clickedXRelativeToInner = x - margin.left;
        const fraction = clickedXRelativeToInner / innerWidth;
        const clickedTimestamp = minDate + (maxDate - minDate) * fraction;
        const clickedDate = new Date(clickedTimestamp).toLocaleDateString('en-CA');

        // Filter raw interactions for the clicked date
        const dailyInteractions = rawInteractions.filter(interaction =>
            new Date(interaction.timestamp).toLocaleDateString('en-CA') === clickedDate
        ).map(interaction => ({
            email: interaction.email || 'N/A',
            firstName: interaction.firstName || 'N/A',
            lastName: interaction.lastName || 'N/A',
            timestamp: new Date(interaction.timestamp).toLocaleString(),
            type: interaction.type // Include type
        }));

        setDisplayedDetails(dailyInteractions);
        setDisplayedDetailsTitle(`Interactions for ${clickedDate}`);
    };

    // Function to handle mouse move on the chart for hover details
    const handleMouseMove = (event) => {
        const svg = event.currentTarget;
        const rect = svg.getBoundingClientRect();
        const mouseX = event.clientX - rect.left; // X-coordinate relative to SVG
        const mouseY = event.clientY - rect.top; // Y-coordinate relative to SVG

        const width = 600;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        if (engagementChartData.length === 0) {
            setHoveredPoint(null);
            return;
        }

        const dates = engagementChartData.map(d => new Date(d.date));
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const allEngagementValues = engagementChartData.flatMap(d => [d.opened, d.clicked, d.replied]);
        const maxValue = Math.max(...allEngagementValues);

        const xScale = (date) => {
            if (minDate === maxDate) return margin.left + innerWidth / 2;
            return margin.left + (innerWidth * (date - minDate) / (maxDate - minDate));
        };

        const yScale = (value) => {
            if (maxValue === 0) return innerHeight + margin.top;
            return innerHeight - (innerHeight * value / maxValue) + margin.top;
        };

        // Find the closest data point based on mouse X
        let closestPoint = null;
        let minDistance = Infinity;

        engagementChartData.forEach(d => {
            const dateObj = new Date(d.date);
            const pointX = xScale(dateObj);
            const distance = Math.abs(mouseX - pointX);

            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = {
                    date: d.date,
                    opened: d.opened,
                    clicked: d.clicked,
                    replied: d.replied,
                    x: pointX,
                    y: yScale(Math.max(d.opened, d.clicked, d.replied)) // Position tooltip near the highest value for that day
                };
            }
        });

        // Only update if the mouse is within a reasonable distance of a point
        if (closestPoint && minDistance < 20) { // Threshold for "hovering over a point"
            setHoveredPoint(closestPoint);
        } else {
            setHoveredPoint(null);
        }
    };

    // Function to handle mouse leave on the chart
    const handleMouseLeave = () => {
        setHoveredPoint(null);
    };


    // Helper to render the SVG line chart
    const renderSvgLineChart = (data) => {
        if (data.length === 0) {
            return <p className="chart-description">No data available for the chart.</p>;
        }

        const width = 600; // Fixed width for SVG, can be made responsive with viewBox
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Extract values for scaling
        const dates = data.map(d => new Date(d.date));
        const allEngagementValues = data.flatMap(d => [d.opened, d.clicked, d.replied]);

        const xScale = (date) => {
            const minDate = Math.min(...dates);
            const maxDate = Math.max(...dates);
            if (minDate === maxDate) return margin.left + innerWidth / 2; // Handle single date case
            return margin.left + (innerWidth * (date - minDate) / (maxDate - minDate));
        };

        const yScale = (value) => {
            const maxValue = Math.max(...allEngagementValues);
            if (maxValue === 0) return innerHeight + margin.top; // Handle no engagement case
            return innerHeight - (innerHeight * value / maxValue) + margin.top;
        };

        // Function to generate smooth path data
        const linePath = (points) => {
            if (points.length === 0) return "";
            let path = `M${points[0]}`;
            for (let i = 1; i < points.length; i++) {
                path += `L${points[i]}`;
            }
            return path;
        };

        const curveFactor = 0.5; // Adjust for more or less curve

        const getSmoothPath = (points) => {
            if (points.length < 2) return linePath(points);

            let path = `M${points[0]}`;
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i].split(',').map(Number);
                const p2 = points[i+1].split(',').map(Number);

                const midX = (p1[0] + p2[0]) / 2;
                const midY = (p1[1] + p2[1]) / 2;

                const cp1x = p1[0] + (p2[0] - p1[0]) * curveFactor;
                const cp1y = p1[1];
                const cp2x = p2[0] - (p2[0] - p1[0]) * curveFactor;
                const cp2y = p2[1];

                path += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
            }
            return path;
        };


        // Create points for lines
        const openedPoints = data.map(d => `${xScale(new Date(d.date))},${yScale(d.opened)}`);
        const clickedPoints = data.map(d => `${xScale(new Date(d.date))},${yScale(d.clicked)}`);
        const repliedPoints = data.map(d => `${xScale(new Date(d.date))},${yScale(d.replied)}`);

        // X-axis labels (simplified for SVG)
        const xTicks = [];
        if (dates.length > 0) {
            const firstDate = dates[0];
            const lastDate = dates[dates.length - 1];
            // Show start, middle, and end dates
            xTicks.push({ value: firstDate, label: firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
            if (dates.length > 2) {
                const midDate = dates[Math.floor(dates.length / 2)];
                xTicks.push({ value: midDate, label: midDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
            }
            if (dates.length > 1) {
                xTicks.push({ value: lastDate, label: lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
            }
        }


        // Y-axis labels (simplified for SVG)
        const yTicks = [];
        const maxValue = Math.max(...allEngagementValues);
        const numYTicks = 5;
        for (let i = 0; i <= numYTicks; i++) {
            const value = Math.round(maxValue * i / numYTicks);
            yTicks.push({ value: value, label: value.toString() });
        }


        return (
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="chart-svg"
                 onClick={handleChartClick} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                <defs>
                    {/* Gradient for Opened Emails */}
                    <linearGradient id="gradientOpened" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    {/* Gradient for Clicked Emails */}
                    <linearGradient id="gradientClicked" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                    {/* Gradient for Replied Emails */}
                    <linearGradient id="gradientReplied" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#ffc658" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#ffc658" stopOpacity={0}/>
                    </linearGradient>
                </defs>

                <g transform={`translate(${margin.left},${margin.top})`}>
                    {/* Grid Lines */}
                    {yTicks.map((tick, i) => (
                        <line key={`y-grid-${i}`} x1="0" y1={yScale(tick.value) - margin.top} x2={innerWidth} y2={yScale(tick.value) - margin.top} stroke="#4a4a4a" strokeDasharray="3 3" />
                    ))}
                    {xTicks.map((tick, i) => (
                        <line key={`x-grid-${i}`} x1={xScale(tick.value) - margin.left} y1="0" x2={xScale(tick.value) - margin.left} y2={innerHeight} stroke="#4a4a4a" strokeDasharray="3 3" />
                    ))}

                    {/* X-Axis */}
                    <line x1="0" y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#9ca3af" strokeWidth="1.5"/>
                    {xTicks.map((tick, i) => (
                        <text key={`x-label-${i}`} x={xScale(tick.value) - margin.left} y={innerHeight + 20} fill="#9ca3af" textAnchor="middle" fontSize="11">
                            {tick.label}
                        </text>
                    ))}

                    {/* Y-Axis */}
                    <line x1="0" y1="0" x2="0" y2={innerHeight} stroke="#9ca3af" strokeWidth="1.5"/>
                    {yTicks.map((tick, i) => (
                        <text key={`y-label-${i}`} x="-10" y={yScale(tick.value) - margin.top} fill="#9ca3af" textAnchor="end" alignmentBaseline="middle" fontSize="11">
                            {tick.label}
                        </text>
                    ))}

                    {/* Area Fills (smoothed) */}
                    <path d={getSmoothPath(openedPoints.concat([`${xScale(dates[dates.length - 1])},${yScale(0)}`, `${xScale(dates[0])},${yScale(0)}`]))} fill="url(#gradientOpened)" />
                    <path d={getSmoothPath(clickedPoints.concat([`${xScale(dates[dates.length - 1])},${yScale(0)}`, `${xScale(dates[0])},${yScale(0)}`]))} fill="url(#gradientClicked)" />
                    <path d={getSmoothPath(repliedPoints.concat([`${xScale(dates[dates.length - 1])},${yScale(0)}`, `${xScale(dates[0])},${yScale(0)}`]))} fill="url(#gradientReplied)" />

                    {/* Lines (smoothed) */}
                    <path fill="none" stroke="#8884d8" strokeWidth="3" d={getSmoothPath(openedPoints)} />
                    <path fill="none" stroke="#82ca9d" strokeWidth="3" d={getSmoothPath(clickedPoints)} />
                    <path fill="none" stroke="#ffc658" strokeWidth="3" d={getSmoothPath(repliedPoints)} />

                    {/* Hover Tooltip and vertical line */}
                    {hoveredPoint && (
                        <g>
                            <line
                                x1={hoveredPoint.x - margin.left}
                                y1="0"
                                x2={hoveredPoint.x - margin.left}
                                y2={innerHeight}
                                stroke="#6b7280" // Gray vertical line
                                strokeDasharray="4 4"
                            />
                            <circle cx={hoveredPoint.x - margin.left} cy={yScale(hoveredPoint.opened) - margin.top} r="5" fill="#8884d8" stroke="#fff" strokeWidth="2" />
                            <circle cx={hoveredPoint.x - margin.left} cy={yScale(hoveredPoint.clicked) - margin.top} r="5" fill="#82ca9d" stroke="#fff" strokeWidth="2" />
                            <circle cx={hoveredPoint.x - margin.left} cy={yScale(hoveredPoint.replied) - margin.top} r="5" fill="#ffc658" stroke="#fff" strokeWidth="2" />

                            <rect
                                x={hoveredPoint.x - margin.left + 15}
                                y={hoveredPoint.y - margin.top - 40}
                                width="120"
                                height="80"
                                fill="#2d3748" // Darker background for tooltip
                                rx="8"
                                ry="8"
                                opacity="0.95"
                                stroke="#4a5568" // Border for tooltip
                                strokeWidth="1"
                            />
                            <text x={hoveredPoint.x - margin.left + 25} y={hoveredPoint.y - margin.top - 20} fill="#fff" fontSize="11" fontWeight="bold">
                                {new Date(hoveredPoint.date).toLocaleDateString()}
                            </text>
                            <text x={hoveredPoint.x - margin.left + 25} y={hoveredPoint.y - margin.top} fill="#8884d8" fontSize="11">
                                Opened: {hoveredPoint.opened}
                            </text>
                            <text x={hoveredPoint.x - margin.left + 25} y={hoveredPoint.y - margin.top + 15} fill="#82ca9d" fontSize="11">
                                Clicked: {hoveredPoint.clicked}
                            </text>
                            <text x={hoveredPoint.x - margin.left + 25} y={hoveredPoint.y - margin.top + 30} fill="#ffc658" fontSize="11">
                                Replied: {hoveredPoint.replied}
                            </text>
                        </g>
                    )}

                    {/* Legend */}
                    <g transform={`translate(${innerWidth - 150}, 10)`}>
                        <rect x="0" y="0" width="15" height="15" fill="#8884d8" rx="3" ry="3"/>
                        <text x="20" y="12" fill="#fff" fontSize="12">Emails Opened</text>
                        <rect x="0" y="20" width="15" height="15" fill="#82ca9d" rx="3" ry="3"/>
                        <text x="20" y="32" fill="#fff" fontSize="12">Emails Clicked</text>
                        <rect x="0" y="40" width="15" height="15" fill="#ffc658" rx="3" ry="3"/>
                        <text x="20" y="52" fill="#fff" fontSize="12">Emails Replied</text>
                    </g>
                </g>
            </svg>
        );
    };


    return (
        <div className="app-container">
            <header className="header">
                <div className="header-content">
                    <h1 className="header-title">Campaign Management Dashboard</h1>
                    <div id="user-info" className="user-info">
                        User ID: {userId}
                    </div>
                </div>
            </header>

            <main className="main-content">
                <div className="main-card">
                    {/* Tabs Navigation */}
                    <nav className="tabs-nav">
                        <button
                            className={`tab-button ${activeTab === 'campaign-analytics' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('campaign-analytics')}
                        >
                            Campaign Analytics
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'ab-testing' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('ab-testing')}
                        >
                            AB Testing
                        </button>
                    </nav>

                    {/* Tab Content */}
                    <div id="tab-content" className="tab-content">
                        {/* Campaign Analytics Tab Content */}
                        {activeTab === 'campaign-analytics' && (
                            <div id="campaign-analytics" className="tab-pane">
                                <h2 className="section-title">Campaign Analytics</h2>
                                <p className="section-description">Track opens, clicks, replies, and bounces directly within Gmail.</p>

                                {/* Campaign Selection Dropdown with Search */}
                                <div className="campaign-selection-card">
                                    <label htmlFor="campaign-search" className="label-text">
                                        Search Campaigns:
                                    </label>
                                    <input
                                        type="text"
                                        id="campaign-search"
                                        placeholder="Search campaign names..."
                                        className="input-field"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />

                                    <label htmlFor="campaign-select" className="label-text">
                                        Choose Campaign:
                                    </label>
                                    <select
                                        id="campaign-select"
                                        className="select-field"
                                        value={selectedCampaignId}
                                        onChange={(e) => {
                                            const newId = e.target.value;
                                            setSelectedCampaignId(newId);
                                            const selectedCamp = campaigns.find(c => c.id === newId);
                                            setSelectedCampaignName(selectedCamp ? selectedCamp.name : 'Select a Campaign');
                                        }}
                                    >
                                        <option value="">All Campaigns</option> {/* Option to view all campaigns */}
                                        {filteredCampaigns.map(campaign => (
                                            <option key={campaign.id} value={campaign.id}>
                                                {campaign.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Scorecard Summary (Top KPIs) */}
                                <div className="kpi-summary-card">
                                    <h3 className="kpi-summary-title">
                                        📊
                                        {selectedCampaignId ? `KPIs for: ${selectedCampaignName}` : 'Overall Campaign KPIs'}
                                    </h3>
                                    <div className="kpi-grid">
                                        <div className="kpi-item">
                                            <p>Total Sent</p>
                                            <p>{kpisToDisplay.totalSent}</p>
                                        </div>
                                        <div className="kpi-item">
                                            <p>Open Rate</p>
                                            <p className="green-text">{kpisToDisplay.openRate}%</p>
                                        </div>
                                        <div className="kpi-item">
                                            <p>CTR</p>
                                            <p className="indigo-text">{kpisToDisplay.ctr}%</p>
                                        </div>
                                        <div className="kpi-item">
                                            <p>Reply Rate</p>
                                            <p className="yellow-text">{kpisToDisplay.replyRate}%</p>
                                        </div>
                                        <div className="kpi-item">
                                            <p>Bounce Rate</p>
                                            <p className="red-text">{kpisToDisplay.bounceRate}%</p>
                                        </div>
                                    </div>
                                    <div className="best-subject-line-card">
                                        <p>Best-performing Subject Line</p>
                                        <p>{kpisToDisplay.bestPerformingSubjectLine || 'N/A'}</p>
                                        <p>
                                            (Based on highest open rate for available dummy data. For true A/B testing, subject line data needs to be tied to individual email interactions.)
                                        </p>
                                    </div>
                                </div>

                                {/* Time Series Line Chart: Engagement Over Time */}
                                {engagementChartData.length > 0 && (
                                    <div className="chart-container">
                                        <h3 className="chart-title">
                                            📈
                                            Engagement Over Time {selectedCampaignId ? `for ${selectedCampaignName}` : ''}
                                        </h3>
                                        <div style={{ width: '100%', height: 300 }}>
                                            {renderSvgLineChart(engagementChartData)}
                                        </div>
                                        <p className="chart-description">
                                            Daily breakdown of opened, clicked, and replied emails. Click on the chart to see details for a specific day.
                                        </p>
                                    </div>
                                )}


                                {selectedCampaignId ? (
                                    <div className="grid-container">
                                        {/* Who Opened Card */}
                                        <div className="kpi-card opened">
                                            <h3>
                                                📧 Who Opened
                                            </h3>
                                            <p>{openedEmails.length}</p>
                                            <button
                                                onClick={() => {
                                                    setDisplayedDetails(openedEmails);
                                                    setDisplayedDetailsTitle('Who Opened');
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>

                                        {/* Who Clicked Card */}
                                        <div className="kpi-card clicked">
                                            <h3>
                                                👆 Who Clicked
                                            </h3>
                                            <p>{clickedEmails.length}</p>
                                            <button
                                                onClick={() => {
                                                    setDisplayedDetails(clickedEmails);
                                                    setDisplayedDetailsTitle('Who Clicked');
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>

                                        {/* Who Received Card */}
                                        <div className="kpi-card received">
                                            <h3>
                                                📥 Who Received
                                            </h3>
                                            <p>{receivedEmails.length}</p>
                                            <button
                                                onClick={() => {
                                                    setDisplayedDetails(receivedEmails);
                                                    setDisplayedDetailsTitle('Who Received');
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>

                                        {/* Who Replied Card */}
                                        <div className="kpi-card replied">
                                            <h3>
                                                ↩️ Who Replied
                                            </h3>
                                            <p>{repliedEmails.length}</p>
                                            <button
                                                onClick={() => {
                                                    setDisplayedDetails(repliedEmails);
                                                    setDisplayedDetailsTitle('Who Replied');
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>

                                        {/* Which Bounced Card */}
                                        <div className="kpi-card bounced">
                                            <h3>
                                                🚫 Which Bounced
                                            </h3>
                                            <p>{bouncedEmails.length}</p>
                                            <button
                                                onClick={() => {
                                                    setDisplayedDetails(bouncedEmails);
                                                    setDisplayedDetailsTitle('Which Bounced');
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>

                                        {/* Total Mails Sent Card */}
                                        <div className="kpi-card sent">
                                            <h3>
                                                ✉️ Total Mails Sent
                                            </h3>
                                            <p>{receivedEmails.length}</p>
                                            <button
                                                onClick={() => {
                                                    setDisplayedDetails(receivedEmails);
                                                    setDisplayedDetailsTitle('Total Mails Sent');
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="no-campaign-selected">Please select a campaign from the dropdown above to view detailed analytics, or view overall KPIs.</p>
                                )}


                                {/* Dynamic Details Table */}
                                {displayedDetails.length > 0 && (
                                    <div className="details-table-wrapper">
                                        {renderDetailsTable(displayedDetails, displayedDetailsTitle)}
                                    </div>
                                )}

                            </div>
                        )}

                        {/* AB Testing Tab Content */}
                        {activeTab === 'ab-testing' && (
                            <div id="ab-testing" className="tab-pane">
                                <h2 className="section-title">AB Testing</h2>
                                <p className="section-description">
                                    Test variations within campaigns to optimize performance. Experiment with different subject lines,
                                    call-to-actions, email content, and send times to discover what resonates best with your audience.
                                </p>
                                {/* AB Testing content */}
                                <div className="ab-testing-card">
                                    <h3>What you can A/B Test:</h3>
                                    <ul>
                                        <li>Subject Lines</li>
                                        <li>Email Content (body text, images, layout)</li>
                                        <li>Call-to-Action (CTA) buttons</li>
                                        <li>Send Times and Days</li>
                                        <li>Sender Name</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <footer className="footer">
                <div className="footer-content">
                    &copy; 2024 Campaign Management Dashboard. All rights reserved.
                </div>
            </footer>
            <div className={getMessageBoxClasses()}>{message.text}</div>
        </div>
    );
}

export default App;
