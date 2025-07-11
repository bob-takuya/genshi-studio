# Genshi Studio User Testing Framework

A comprehensive user testing simulation framework that coordinates 100+ AI agents to simulate diverse user personas testing the Genshi Studio application.

## Overview

This framework simulates real user testing scenarios with AI agents acting as different user personas:

- **25 Digital Artists** - Testing pattern creation and artistic workflows
- **20 Web Developers** - Testing code-based pattern generation and APIs
- **15 Educators** - Testing educational features and documentation
- **20 Students** - Testing learning curve and accessibility
- **10 UX/UI Designers** - Testing interface design and usability
- **10 Cultural Researchers** - Testing pattern accuracy and cultural context

## Framework Components

### Core Files

1. **`user-testing-coordination-plan.json`** - Master configuration file defining agent personas, testing scenarios, and coordination protocols
2. **`testing-coordinator.py`** - Central coordinator that manages all testing agents and scenarios
3. **`testing-agent-simulator.py`** - Individual agent simulator that executes user persona behaviors
4. **`launch-user-testing.py`** - Main launcher script that starts the complete testing session
5. **`validate-testing-framework.py`** - Validation script to ensure framework integrity

### Testing Scenarios

The framework tests 8 comprehensive scenarios:

- **S001: First-Time User Experience** - Onboarding and initial impressions
- **S002: Pattern Creation Workflows** - Manual pattern creation and editing
- **S003: Code-Based Pattern Generation** - Programming interface testing
- **S004: Growth Studio Exploration** - Advanced pattern growth features
- **S005: Export and Integration** - File export and external tool integration
- **S006: Cross-Platform Compatibility** - Browser and device testing
- **S007: Accessibility Testing** - WCAG compliance and inclusive design
- **S008: Educational Features** - Learning resources and documentation

## Quick Start

### Prerequisites

1. **AI Creative Team System** must be installed and configured
2. **Python 3.8+** with required dependencies
3. **Qdrant Vector Database** running for knowledge storage
4. **Dashboard Server** for real-time monitoring

### Installation

```bash
# Navigate to the testing directory
cd /Users/homeserver/ai-creative-team/projects/genshi-studio/testing

# Ensure Python dependencies are installed
pip install asyncio aiohttp

# Validate the framework
python validate-testing-framework.py
```

### Running the Tests

```bash
# Launch the complete testing simulation
python launch-user-testing.py
```

This will:
1. Launch the testing coordinator
2. Spawn 100+ testing agents with diverse personas
3. Execute all 8 testing scenarios in parallel
4. Monitor progress and collect results
5. Generate comprehensive reports

### Monitoring Progress

The testing framework integrates with the AI Creative Team dashboard for real-time monitoring:

```bash
# Start the dashboard (in separate terminal)
cd /Users/homeserver/ai-creative-team/dashboard
node comprehensive-dashboard-server.js
```

Visit `http://localhost:3000` to view:
- Live agent activity
- Testing scenario progress
- Inter-agent communications
- Performance metrics

## Testing Execution Flow

### Phase 1: Setup (2 hours)
- Agent registration and persona assignment
- Communication hub initialization
- Testing environment preparation

### Phase 2: Core Features (4 hours)
- **Track A**: Onboarding and Pattern Creation (50 agents)
- **Track B**: Code Generation and Growth Studio (50 agents)

### Phase 3: Specialized Testing (3 hours)
- **Track C**: Export and Cross-Platform (40 agents)
- **Track D**: Accessibility and Educational (60 agents)

### Phase 4: Edge Cases (2 hours)
- Stress testing with concurrent users
- Error handling validation
- Recovery mechanism testing

### Phase 5: Analysis (1 hour)
- Data aggregation and analysis
- Report generation
- Knowledge base updates

## Agent Persona Examples

### Digital Artist - Maya (Professional)
- **Experience**: Professional commercial pattern designer
- **Tools**: Photoshop, Illustrator, Adobe Creative Suite
- **Focus**: High-quality commercial patterns and client work
- **Behavior**: High patience, moderate technical skill, detailed feedback

### Web Developer - Chris (Senior)
- **Experience**: Senior full-stack developer
- **Languages**: JavaScript, Python, React, Node.js
- **Focus**: Integration capabilities and code quality
- **Behavior**: High technical skill, moderate patience, technical feedback

### Student - Emma (High School)
- **Experience**: Beginning digital art student
- **Interest**: Learning digital art fundamentals
- **Focus**: Ease of use and learning resources
- **Behavior**: Low technical skill, high exploration, needs guidance

## Data Collection

The framework collects comprehensive metrics:

### Quantitative Metrics
- Task completion times
- Error frequencies
- Feature usage statistics
- Performance measurements
- Success/failure rates

### Qualitative Metrics
- User satisfaction ratings
- Feature intuitiveness scores
- Pain point descriptions
- Improvement suggestions
- Overall experience feedback

## Results and Reports

### Output Files

Results are saved to `testing/results/` with timestamps:

- **`testing_report_YYYYMMDD_HHMMSS.json`** - Comprehensive testing results
- **`testing_summary_YYYYMMDD_HHMMSS.json`** - Executive summary
- **`validation_report_YYYYMMDD_HHMMSS.json`** - Framework validation results

### Report Structure

```json
{
  "testing_session": {
    "start_time": "2025-07-10T10:00:00Z",
    "end_time": "2025-07-10T22:00:00Z",
    "total_agents": 100,
    "total_scenarios": 8
  },
  "agent_results": {
    "ARTIST_001": {
      "category": "digital_artists",
      "persona": {...},
      "completed_scenarios": ["S001", "S002"],
      "metrics": {...}
    }
  },
  "scenario_results": {
    "S001": {
      "name": "First-Time User Experience",
      "completion_rate": 0.95,
      "average_satisfaction": 4.2
    }
  },
  "summary": {
    "overall_completion_rate": 0.92,
    "bugs_found": 23,
    "usability_issues": 15,
    "average_satisfaction": 4.1
  }
}
```

## Communication Protocols

The framework uses the AI Creative Team communication hub for inter-agent coordination:

### Message Types
- **TASK_ASSIGNMENT** - Coordinator assigns scenarios to agents
- **STATUS_UPDATE** - Agents report progress and metrics
- **KNOWLEDGE_SHARE** - Agents share discoveries and insights
- **HELP_REQUEST** - Agents request assistance with blockers
- **COLLABORATION_REQUEST** - Agents coordinate with each other

### Real-Time Features
- Live progress monitoring
- Instant issue escalation
- Dynamic resource allocation
- Adaptive scenario scheduling

## Customization

### Adding New Personas

Edit `user-testing-coordination-plan.json` to add new agent categories:

```json
{
  "agent_distribution": {
    "categories": {
      "your_new_category": {
        "count": 10,
        "agent_ids": ["YOURCATEGORY_001" through "YOURCATEGORY_010"],
        "focus_areas": [
          "specific_focus_1",
          "specific_focus_2"
        ]
      }
    }
  }
}
```

### Creating New Scenarios

Add new testing scenarios to the configuration:

```json
{
  "testing_scenarios": {
    "your_scenario": {
      "scenario_id": "S009",
      "name": "Your Custom Scenario",
      "duration": "45 minutes",
      "tasks": [
        "Task 1 description",
        "Task 2 description"
      ],
      "assigned_agents": "Category-specific agents"
    }
  }
}
```

### Adjusting Persona Behaviors

Modify agent behaviors in `testing-agent-simulator.py`:

```python
def setup_persona_behavior(self):
    self.behavior = {
        "patience_level": random.uniform(0.3, 1.0),
        "technical_skill": self.get_technical_skill_level(),
        "error_tolerance": random.uniform(0.2, 0.8),
        "exploration_tendency": random.uniform(0.4, 0.9),
        "feedback_verbosity": random.uniform(0.3, 0.9)
    }
```

## Troubleshooting

### Common Issues

1. **Agent Registration Failures**
   - Check communication hub connectivity
   - Verify Qdrant database is running
   - Ensure proper network configuration

2. **Scenario Timeout Issues**
   - Increase timeout values in coordination plan
   - Check system resource availability
   - Monitor agent execution logs

3. **Data Collection Problems**
   - Verify results directory permissions
   - Check disk space availability
   - Review knowledge base connectivity

### Debugging

Enable debug logging:

```bash
# Set environment variable
export ACTS_LOG_LEVEL=DEBUG

# Run with verbose output
python launch-user-testing.py --verbose
```

### Performance Optimization

For large-scale testing:

1. **Batch Agent Deployment** - Deploy agents in smaller batches
2. **Resource Monitoring** - Monitor CPU and memory usage
3. **Network Optimization** - Ensure adequate bandwidth
4. **Database Tuning** - Optimize Qdrant configuration

## Integration with CI/CD

The framework can be integrated into continuous integration pipelines:

```yaml
# Example GitHub Actions workflow
name: User Testing Simulation
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  user-testing:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.8
    - name: Install dependencies
      run: pip install -r requirements.txt
    - name: Validate framework
      run: python testing/validate-testing-framework.py
    - name: Run user testing
      run: python testing/launch-user-testing.py
    - name: Upload results
      uses: actions/upload-artifact@v2
      with:
        name: testing-results
        path: testing/results/
```

## Best Practices

### Test Design
- **Diverse Personas** - Include users with varying skill levels
- **Realistic Scenarios** - Base tests on actual user workflows
- **Comprehensive Coverage** - Test all major features and edge cases
- **Accessibility Focus** - Ensure inclusive design validation

### Execution
- **Parallel Processing** - Run multiple scenarios simultaneously
- **Progress Monitoring** - Track real-time execution status
- **Error Handling** - Implement robust error recovery
- **Resource Management** - Monitor system resources

### Analysis
- **Quantitative Analysis** - Focus on measurable metrics
- **Qualitative Insights** - Capture user experience feedback
- **Actionable Recommendations** - Provide specific improvement suggestions
- **Continuous Improvement** - Iterate based on results

## Support and Documentation

### Additional Resources
- **AI Creative Team Documentation** - `/docs/` directory
- **Dashboard Guide** - `/dashboard/README.md`
- **API Documentation** - `/src/core/api_documentation.md`

### Getting Help
- **System Logs** - Check `/logs/` directory for detailed execution logs
- **Knowledge Base** - Query Qdrant database for historical insights
- **Community Forum** - AI Creative Team user community

## License

This testing framework is part of the AI Creative Team System and follows the same licensing terms.

---

**Last Updated**: July 10, 2025
**Version**: 1.0.0
**Maintainer**: AI Creative Team - Testing Division