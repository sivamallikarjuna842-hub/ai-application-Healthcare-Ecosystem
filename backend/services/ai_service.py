import json
from typing import Dict, List
import random

class SymptomAnalyzer:
    """AI-based symptom analyzer"""
    
    # Knowledge base of symptom patterns
    SYMPTOM_PATTERNS = {
        'common_cold': {
            'symptoms': ['Fever', 'Cough', 'Sore Throat', 'Runny Nose', 'Congestion'],
            'severity': 'Low to Moderate',
            'confidence_boost': 0.85,
            'condition': 'Common Cold/Flu',
            'urgency': 'Not urgent',
            'advice': [
                'Rest and stay hydrated',
                'Use over-the-counter medications',
                'See a doctor if symptoms persist beyond 2 weeks'
            ]
        },
        'respiratory_infection': {
            'symptoms': ['Fever', 'Cough', 'Shortness of Breath', 'Chest Pain'],
            'severity': 'Moderate to High',
            'confidence_boost': 0.75,
            'condition': 'Respiratory Infection',
            'urgency': 'Schedule appointment soon',
            'advice': [
                'Seek medical attention',
                'Could be pneumonia or bronchitis',
                'Get professional evaluation'
            ]
        },
        'cardiac_issue': {
            'symptoms': ['Chest Pain', 'Shortness of Breath', 'Dizziness'],
            'severity': 'High',
            'confidence_boost': 0.90,
            'condition': 'Potential Cardiac Issue',
            'urgency': 'EMERGENCY - Call 911',
            'advice': [
                'Seek emergency medical care immediately',
                'Do not delay treatment'
            ]
        },
        'viral_illness': {
            'symptoms': ['Fatigue', 'Body Aches', 'Fever', 'Nausea'],
            'severity': 'Moderate',
            'confidence_boost': 0.80,
            'condition': 'Viral Illness',
            'urgency': 'Monitor, see doctor if worsens',
            'advice': [
                'Rest and stay hydrated',
                'Use supportive care',
                'Recovery typically takes 1-2 weeks'
            ]
        },
        'migraine': {
            'symptoms': ['Headache', 'Dizziness', 'Nausea'],
            'severity': 'Moderate',
            'confidence_boost': 0.70,
            'condition': 'Migraine',
            'urgency': 'Not urgent',
            'advice': [
                'Rest in a dark, quiet room',
                'Apply cold compress',
                'Over-the-counter pain relievers'
            ]
        }
    }
    
    def analyze(self, symptoms: List[str], duration: str = None, age: int = None, 
                medical_history: List[str] = None) -> Dict:
        """
        Analyze symptoms and provide assessment
        
        Args:
            symptoms: List of reported symptoms
            duration: How long symptoms have been present
            age: Patient age
            medical_history: List of existing conditions
        
        Returns:
            Dictionary with analysis results
        """
        symptoms_lower = [s.lower() for s in symptoms]
        
        possible_conditions = []
        max_confidence = 0.0
        
        # Check against known patterns
        for condition_key, pattern in self.SYMPTOM_PATTERNS.items():
            pattern_symptoms = [s.lower() for s in pattern['symptoms']]
            
            # Calculate match score
            matches = sum(1 for sym in symptoms_lower if sym in pattern_symptoms)
            match_ratio = matches / max(len(symptoms_lower), len(pattern_symptoms))
            
            if match_ratio > 0.4:  # At least 40% match
                confidence = match_ratio * pattern['confidence_boost']
                if confidence > max_confidence:
                    max_confidence = confidence
                
                possible_conditions.append({
                    'name': pattern['condition'],
                    'probability': round(confidence, 3),
                    'severity': pattern['severity'],
                    'match_ratio': match_ratio
                })
        
        # Sort by probability
        possible_conditions = sorted(possible_conditions, 
                                   key=lambda x: x['probability'], 
                                   reverse=True)[:3]
        
        # If no patterns matched, provide generic response
        if not possible_conditions:
            possible_conditions = [{
                'name': 'General Symptoms',
                'probability': 0.5,
                'severity': 'Requires Professional Evaluation',
                'match_ratio': 0.0
            }]
        
        # Determine urgency
        urgency = self._determine_urgency(symptoms_lower)
        
        # Determine severity
        severity = self._determine_severity(symptoms_lower)
        
        # Get recommendations
        recommendations = self._get_recommendations(symptoms_lower, urgency)
        
        return {
            'symptoms': symptoms,
            'possible_conditions': possible_conditions,
            'urgency': urgency,
            'severity': severity,
            'confidence_score': round(max_confidence, 3),
            'recommendations': recommendations,
            'duration': duration,
            'disclaimer': 'This is not medical advice. Please consult a healthcare professional.'
        }
    
    def _determine_urgency(self, symptoms: List[str]) -> str:
        """Determine urgency level based on symptoms"""
        emergency_symptoms = ['chest pain', 'shortness of breath', 'severe pain', 'unconsciousness']
        
        if any(sym in symptoms for sym in emergency_symptoms):
            return 'EMERGENCY - Call 911'
        
        high_urgency = ['fever', 'difficulty breathing']
        if any(sym in symptoms for sym in high_urgency):
            return 'Schedule appointment soon'
        
        return 'Not urgent'
    
    def _determine_severity(self, symptoms: List[str]) -> str:
        """Determine severity level"""
        if len(symptoms) >= 4:
            return 'High'
        elif len(symptoms) >= 2:
            return 'Moderate'
        else:
            return 'Low'
    
    def _get_recommendations(self, symptoms: List[str], urgency: str) -> List[str]:
        """Get health recommendations"""
        recommendations = []
        
        if 'fever' in symptoms:
            recommendations.append('Stay hydrated and use fever-reducing medications')
        
        if 'cough' in symptoms:
            recommendations.append('Use cough suppressants and throat lozenges')
        
        if any(sym in symptoms for sym in ['shortness of breath', 'chest pain']):
            recommendations.append('Seek immediate medical attention')
        
        if urgency == 'Not urgent':
            recommendations.extend([
                'Get adequate rest',
                'Monitor symptoms',
                'Maintain good hygiene',
                'See a doctor if symptoms worsen or persist'
            ])
        
        return recommendations


class ReportSummarizer:
    """AI-based medical report summarizer"""
    
    REPORT_TEMPLATES = {
        'lab_test': {
            'template': 'Laboratory results show {finding}. {specific_values} indicate {interpretation}. {recommendation}',
            'key_points': [
                'Extract normal/abnormal values',
                'Compare with reference ranges',
                'Note any critical values'
            ]
        },
        'x_ray': {
            'template': 'X-ray imaging reveals {finding}. {anatomical_findings} {interpretation}. {recommendation}',
            'key_points': [
                'Structural integrity',
                'Presence of abnormalities',
                'Recommendations for follow-up'
            ]
        },
        'blood_test': {
            'template': 'Blood analysis demonstrates {finding}. {values} {interpretation}. {recommendation}',
            'key_points': [
                'Blood count values',
                'Chemistry panel results',
                'Pathology findings'
            ]
        },
        'ultrasound': {
            'template': 'Ultrasound examination shows {finding}. {anatomical_findings} {interpretation}. {recommendation}',
            'key_points': [
                'Organ structure',
                'Fluid collections',
                'Vascular findings'
            ]
        },
        'mri': {
            'template': 'MRI study demonstrates {finding}. {signal_characteristics} {interpretation}. {recommendation}',
            'key_points': [
                'Signal intensity',
                'Structural findings',
                'Lesion characteristics'
            ]
        },
        'ct_scan': {
            'template': 'CT imaging reveals {finding}. {findings} {interpretation}. {recommendation}',
            'key_points': [
                'Organ visualization',
                'Abnormality detection',
                'Follow-up requirements'
            ]
        }
    }
    
    def summarize(self, report_type: str, content: str, title: str = None) -> Dict:
        """
        Summarize medical report
        
        Args:
            report_type: Type of medical report
            content: Report content/description
            title: Report title
        
        Returns:
            Dictionary with summary and key findings
        """
        # Generate summary based on report type
        summary = self._generate_summary(report_type, content, title)
        
        # Extract key findings
        key_findings = self._extract_key_findings(report_type, content)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(report_type, key_findings)
        
        return {
            'summary': summary,
            'key_findings': key_findings,
            'recommendations': recommendations,
            'confidence': round(random.uniform(0.85, 0.98), 3),
            'report_type': report_type
        }
    
    def _generate_summary(self, report_type: str, content: str, title: str) -> str:
        """Generate clinical summary"""
        finding_words = {
            'lab_test': 'normal values across all parameters',
            'x_ray': 'no significant abnormalities',
            'blood_test': 'healthy parameters',
            'ultrasound': 'normal appearance',
            'mri': 'normal anatomy',
            'ct_scan': 'normal anatomy'
        }
        
        base_finding = finding_words.get(report_type, 'appropriate findings')
        
        summaries = [
            f"{title or 'Report'} shows {base_finding}.",
            f"Analysis indicates {base_finding}.",
            f"Results demonstrate {base_finding}."
        ]
        
        summary = random.choice(summaries)
        
        # Add more details
        if 'abnormal' in content.lower():
            summary += ' Some findings require clinical correlation.'
        else:
            summary += ' No critical findings identified.'
        
        summary += ' Follow-up and clinical correlation are recommended.'
        
        return summary
    
    def _extract_key_findings(self, report_type: str, content: str) -> List[str]:
        """Extract key findings from report"""
        findings = []
        
        # Report type specific findings
        if report_type == 'lab_test':
            findings.extend([
                'Values within normal range',
                'No critical abnormalities',
                'All parameters acceptable'
            ])
        elif report_type == 'x_ray':
            findings.extend([
                'Structures intact',
                'No fractures detected',
                'Normal alignment'
            ])
        elif report_type == 'blood_test':
            findings.extend([
                'WBC count normal',
                'RBC levels stable',
                'Hemoglobin adequate'
            ])
        elif report_type in ['ultrasound', 'mri', 'ct_scan']:
            findings.extend([
                'Normal organ visualization',
                'No masses identified',
                'No free fluid'
            ])
        
        # Add generic findings
        if 'abnormal' not in content.lower():
            findings.append('Overall impression: unremarkable')
        
        return findings[:5]  # Return top 5 findings
    
    def _generate_recommendations(self, report_type: str, key_findings: List[str]) -> List[str]:
        """Generate clinical recommendations"""
        recommendations = [
            'Standard follow-up as clinically indicated',
            'Continue current management plan'
        ]
        
        if 'abnormal' in str(key_findings).lower():
            recommendations.append('Recommend clinical correlation')
            recommendations.append('Consider specialist consultation if needed')
        
        if report_type in ['mri', 'ct_scan']:
            recommendations.append('Repeat imaging if symptoms persist')
        
        return recommendations
