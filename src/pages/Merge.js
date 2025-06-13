import React, { useState } from "react";
import { Dropzone } from "@dropzone-ui/react";
import PdfList from "../components/PdfList";
import { Button, Container, Row, Col, Spinner } from "react-bootstrap";
import { PDFDocument } from "pdf-lib";
import { readFile } from "../utils/readFile";
import Form from "react-bootstrap/Form";
import JSZip from "jszip";
import arrayShuffle from "array-shuffle";
import { useReactToPrint } from "react-to-print";

const Merge = () => {
  const [pdfs, setPdfs] = useState([]);
  const [outputPdfs, setOutputPdfs] = useState([]);
  const [splitAmount, setSplitAmount] = useState(1);
  const [containedAmount, setContainedAmount] = useState(1);
  const [isDownloadable, setDownloadable] = useState(false);
  const [isProcessing, setProcessing] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);
  const [zippedFile, setZippedFile] = useState(null);

  const handleChange = (event) => {
    setContainedAmount(
      event.target.value <= 0
        ? 1
        : event.target.value > pdfs.length
        ? pdfs.length
        : event.target.value
    );
  };

  const updatePdfs = (newPdfs) => {
    const newValidPdfs = newPdfs.filter(
      (pdf) => pdf.valid && !pdfs.find((p) => p.file.name === pdf.file.name)
    );
    if (newValidPdfs.length !== 0) {
      setDownloadable(false);
    }
    setPdfs([...pdfs, ...newValidPdfs]);
  };

  const handlePDFs = async () => {
    if (splitAmount <= 1) {
      await mergeSinglePdf();
    } else {
      await mergeMultiplePdfs();
    }
  };

  const mergeMultiplePdfs = async () => {
    setOutputPdfs([]);
    var outputPdfsLocal = [];
    for (let i = 0; i < splitAmount; i++) {
      try {
        var shuffledPdfs = arrayShuffle(pdfs).slice(0, containedAmount);
        const arrayBufferPromises = shuffledPdfs.map((pdf) =>
          readFile(pdf.file)
        );
        const arrayBuffers = await Promise.all(arrayBufferPromises);

        const pdfDocumentPromises = arrayBuffers.map((buffer) =>
          PDFDocument.load(buffer)
        );
        const pdfDocuments = await Promise.all(pdfDocumentPromises);

        const mergedPdf = await PDFDocument.create();

        for (const pdf of pdfDocuments) {
          const copiedPages = await mergedPdf.copyPages(
            pdf,
            pdf.getPageIndices()
          );
          copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
          });
        }

        const mergedPdfFile = await mergedPdf.save({ addDefaultPage: false });

        const mergedPdfBlob = new Blob([mergedPdfFile], {
          type: "application/pdf",
        });
        console.log(`Merged PDF ${i + 1} size: ${mergedPdfBlob.size} bytes`);
        // setOutputPdfs(outputPdfs => [...outputPdfs, {mergedPdfBlob}]);
        outputPdfsLocal.push(mergedPdfBlob);
        console.log("Output PDFs:", outputPdfsLocal);
      } catch (error) {
        console.error(error);
        alert(
          "Something went wrong. Please try again or check the console for more information."
        );
      }
    }
    console.log("Output PDFs:", outputPdfsLocal);
    const zip = new JSZip();

    outputPdfsLocal.forEach((pdfBlob, index) => {
      zip.file(`merged_pdf_${index + 1}.pdf`, pdfBlob);
    });
    // setZippedFile(zip);

    const zipContent = await zip.generateAsync({ type: "blob" });
    console.log(zipContent.size);
    const blob = new Blob([zipContent], { type: "application/zip" });

    const mergedPdfZipUrl = URL.createObjectURL(blob);
    setDownloadLink(mergedPdfZipUrl);
    setDownloadable(true);
    setProcessing(false);
  };

  const mergeSinglePdf = async () => {
    try {
      const arrayBufferPromises = pdfs.map((pdf) => readFile(pdf.file));
      const arrayBuffers = await Promise.all(arrayBufferPromises);

      const pdfDocumentPromises = arrayBuffers.map((buffer) =>
        PDFDocument.load(buffer)
      );
      const pdfDocuments = await Promise.all(pdfDocumentPromises);

      const mergedPdf = await PDFDocument.create();

      for (const pdf of pdfDocuments) {
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const mergedPdfFile = await mergedPdf.save({ addDefaultPage: false });

      const mergedPdfBlob = new Blob([mergedPdfFile], {
        type: "application/pdf",
      });
      const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob);
      setDownloadLink(mergedPdfUrl);
      setDownloadable(true);
      setProcessing(false);
    } catch (error) {
      console.error(error);
      alert(
        "Something went wrong. Please try again or check the console for more information."
      );
    }
  };

  const handlePrint = () => {
    var iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    iframe.style.display = "none";
    iframe.src = downloadLink;
    iframe.onload = function () {
      setTimeout(function () {
        iframe.focus();
        iframe.contentWindow.print();
      }, 1);
    };
  };

  // const mergePdfs = async () => {
  //   try {
  //     const arrayBufferPromises = pdfs.map((pdf) => readFile(pdf.file));
  //     const arrayBuffers = await Promise.all(arrayBufferPromises);

  //     const pdfDocumentPromises = arrayBuffers.map((buffer) =>
  //       PDFDocument.load(buffer)
  //     );
  //     const pdfDocuments = await Promise.all(pdfDocumentPromises);

  //     const mergedPdf = await PDFDocument.create();

  //     for (const pdf of pdfDocuments) {
  //       const copiedPages = await mergedPdf.copyPages(
  //         pdf,
  //         pdf.getPageIndices()
  //       );
  //       copiedPages.forEach((page) => {
  //         mergedPdf.addPage(page);
  //       });
  //     }

  //     const mergedPdfFile = await mergedPdf.save({ addDefaultPage: false });

  //     const mergedPdfBlob = new Blob([mergedPdfFile], {
  //       type: "application/pdf",
  //     });
  //     const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob);
  //     setDownloadLink(mergedPdfUrl);
  //     setDownloadable(true);
  //     setProcessing(false);
  //   } catch (error) {
  //     console.error(error);
  //     alert(
  //       "Something went wrong. Please try again or check the console for more information."
  //     );
  //   }
  // };

  return (
    <>
      <Dropzone
        onChange={updatePdfs}
        value={pdfs}
        accept="application/pdf"
        label="Drop your pdfs here"
        header={false}
        footer={false}
        behaviour="replace"
      />
      <Container className="my-4">
        {pdfs.length > 1 && !isDownloadable && !isProcessing && (
          <Form>
            <Row md="12" lg="4" className="justify-content-center">
              <Col>
                <Form.Label>Amount of generated PDFs</Form.Label>
                <Form.Control
                  type="number"
                  className="w-100 my-2 big-text"
                  placeholder="1"
                  onChange={(e) => {
                    setSplitAmount(e.target.value);
                  }}
                />
              </Col>
              <Col>
                <Form.Label>
                  Pages per PDF (Only when creating more than 1)
                </Form.Label>
                <Form.Control
                  type="number"
                  className="w-100 my-2 big-text"
                  placeholder="1"
                  value={containedAmount}
                  readOnly={splitAmount <= 1}
                  onChange={handleChange}
                />
              </Col>
              <Col>
                <Button
                  className="w-100 my-2 big-text"
                  onClick={async () => {
                    if (!isDownloadable) {
                      setDownloadable(false);
                      setProcessing(true);
                      await handlePDFs();
                    }
                  }}
                >
                  Merge
                </Button>
              </Col>
            </Row>
          </Form>
        )}
        {isDownloadable && (
          <Row md="12" lg="4" className="justify-content-center">
            <Col>
              <Button
                className="w-100 my-2 big-text"
                variant="warning"
                href={downloadLink}
                download={splitAmount <= 1 ? "merged.pdf" : "merged_pdfs.zip"}
              >
                Download
              </Button>
            </Col>
            {splitAmount <= 1 && (
              <Col>
                <Button
                  className="w-100 my-2 big-text"
                  variant="warning"
                  active={splitAmount <= 1}
                  onClick={() => {
                    handlePrint();
                  }}
                >
                  Print
                </Button>
              </Col>
            )}
          </Row>
        )}
        {isProcessing && (
          <Row md="12" lg="4" className="justify-content-center">
            <Col>
              <div className="text-center my-3 big-text">
                processing{" "}
                <Spinner animation="border" variant="primary" size="sm" />
              </div>
            </Col>
          </Row>
        )}
        {pdfs.length > 1 && !isProcessing && (
          <Row sm="12" className="justify-content-center">
            <Col className="px-0">
              <h6 className="mb-0 mt-3">
                Change the order of your PDFs by dragging and dropping them in
                the desired spot below.
              </h6>
            </Col>
          </Row>
        )}
      </Container>
      {!isProcessing && (
        <PdfList
          list={pdfs}
          setList={setPdfs}
          setDownloadable={setDownloadable}
        />
      )}
    </>
  );
};

export default Merge;
